/* eslint-disable @typescript-eslint/naming-convention */
import { container, inject, injectable } from 'tsyringe';
import { Logger } from '@map-colonies/js-logger';
import { BadRequestError, ConflictError, NotFoundError, NotImplementedError } from '@map-colonies/error-types';
import { lookup as mimeLookup, TilesMimeFormat } from '@map-colonies/types';
import { withSpanAsyncV4 } from '@map-colonies/telemetry';
import { Tracer } from '@opentelemetry/api';
import { SERVICES } from '../../common/constants';
import {
  ILayerPostRequest,
  IMapProxyCache,
  IMapProxyJsonDocument,
  IMapProxyLayer,
  IMapProxyConfig,
  IConfigProvider,
  ICacheProvider,
  ICacheSource,
  IRedisConfig,
  ICacheObject,
  IRedisSource,
  IS3Source,
  IFSSource,
} from '../../common/interfaces';
import { isLayerNameExists } from '../../common/validations/isLayerNameExists';
import { S3Source } from '../../common/cacheProviders/S3Source';
import { GpkgSource } from '../../common/cacheProviders/gpkgSource';
import { FSSource } from '../../common/cacheProviders/fsSource';
import { SourceTypes } from '../../common/enums';
import { RedisSource } from '../../common/cacheProviders/redisSource';
import { ConfigsManager } from '../../configs/models/configsManager';
import { getRedisCacheName, getRedisCacheOriginalName, isLayerNameSuffixRedis } from '../../common/utils';

@injectable()
class LayersManager {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.MAPPROXY) private readonly mapproxyConfig: IMapProxyConfig,
    @inject(SERVICES.REDISCONFIG) private readonly redisConfig: IRedisConfig,
    @inject(SERVICES.CONFIGPROVIDER) private readonly configProvider: IConfigProvider,
    @inject(SERVICES.TRACER) public readonly tracer: Tracer,
    @inject(ConfigsManager) private readonly manager: ConfigsManager
  ) {}

  @withSpanAsyncV4
  public async getLayer(layerName: string): Promise<IMapProxyCache> {
    const jsonDocument: IMapProxyJsonDocument = await this.configProvider.getJson();

    if (!isLayerNameExists(jsonDocument, layerName)) {
      throw new NotFoundError(`Layer name '${layerName}' does not exist`);
    }
    const requestedLayer: IMapProxyCache = jsonDocument.caches[layerName] as IMapProxyCache;
    return requestedLayer;
  }

  @withSpanAsyncV4
  public async getCacheByNameAndType(layerName: string, cacheType: string): Promise<ICacheObject> {
    const configJson = await this.configProvider.getJson();
    const requestedLayer = configJson.layers.find((layer) => layer.name === layerName);

    if (!requestedLayer) {
      const errorMsg = `${layerName} layer not found on mapproxy configuration`;
      this.logger.warn({ msg: errorMsg, layerName, cacheType });
      throw new NotFoundError(errorMsg);
    }

    // our current only real cache layer, other caches cases are known as the source layers
    const cacheName = cacheType === SourceTypes.REDIS ? getRedisCacheName(layerName) : layerName;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const currentSourceCache: IMapProxyCache | undefined = configJson.caches[cacheName];

    if (currentSourceCache === undefined) {
      const errorMsg = `cache not found for ${layerName} layer`;
      this.logger.warn({ msg: errorMsg, layerName, cacheType });
      throw new NotFoundError(errorMsg);
    }
    if (currentSourceCache.cache.type !== cacheType) {
      const errorMsg = `${layerName} layer cache not found with requested cache type: ${cacheType}`;
      this.logger.warn({ msg: errorMsg, layerName, cacheType });
      throw new BadRequestError(errorMsg);
    }

    type AvailableSources = IRedisSource | IS3Source | IFSSource;

    return {
      cacheName: cacheName,
      cache: currentSourceCache.cache as AvailableSources,
    };
  }

  @withSpanAsyncV4
  public async addLayer(layerRequest: ILayerPostRequest): Promise<void> {
    await this.validateGridCorrectness();
    const editJson = (jsonDocument: IMapProxyJsonDocument): IMapProxyJsonDocument => {
      if (isLayerNameSuffixRedis(layerRequest.name)) {
        const errorMsg = `layer names that ends with '-redis' are not supported`;
        this.logger.warn({ msg: errorMsg, request: layerRequest });
        throw new NotImplementedError(errorMsg);
      }
      this.logger.info({ msg: 'add new layer', layerRequest });
      this.addNewCache(jsonDocument, layerRequest);

      return jsonDocument;
    };

    await this.configProvider.updateJson(editJson);
  }

  @withSpanAsyncV4
  public async removeLayer(layersName: string[]): Promise<string[] | void> {
    this.logger.info({ msg: `Remove layers request for: [${layersName.join(',')}]`, layersName });
    const errorMessage = 'no valid layers to delete';
    let failedCaches;
    const failedLayers: string[] = [];
    const deletedLayers: string[] = [];

    layersName.forEach((layerName) => {
      if (isLayerNameSuffixRedis(layerName)) {
        const errorMsg = `layer names that ends with '-redis' are not supported`;
        this.logger.warn({ msg: errorMsg, layersName, currentLayerName: layerName });
        throw new NotImplementedError(errorMsg);
      }
    });

    const editJson = (jsonDocument: IMapProxyJsonDocument): IMapProxyJsonDocument => {
      layersName.forEach((layerName) => {
        // remove requested layer from layers array
        const requestedLayerIndex: number = jsonDocument.layers.findIndex((layer) => layer.name === layerName);
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        if (requestedLayerIndex !== -1) {
          jsonDocument.layers.splice(requestedLayerIndex, 1);
          this.logger.info({ msg: `Successfully removed layer '${layerName}'` });
          deletedLayers.push(layerName);
        } else {
          this.logger.error({ msg: `Failed to removed layer '${layerName}'` });
          failedLayers.push(layerName);
        }
      });

      const allLinkedCaches = this.getAllLayerLinkedCaches(layersName, jsonDocument);
      this.logger.info({ msg: `Total linked caches that will be removed is ${allLinkedCaches.length}`, layersName, allLinkedCaches });
      allLinkedCaches.forEach((cacheName) => {
        // remove requested layer cache source from cache list
        delete jsonDocument.caches[cacheName];
        this.logger.info({ msg: `Successfully removed cache '${cacheName}'`, cacheName });
      });

      if (failedLayers.length !== 0) {
        const notFoundMessege = `layers were not found for deletion`;
        this.logger.error({ msg: notFoundMessege, failedLayers, totalFailedLayers: failedLayers.length });
      }

      failedCaches = layersName.filter((layerName) => !allLinkedCaches.includes(layerName));
      if (failedCaches.length !== 0) {
        const notFoundMessege = `caches: ['${failedCaches.join(',')}'] were not found`;
        this.logger.error({ msg: notFoundMessege, failedCaches, totalFailedCaches: failedCaches.length });
      }
      if (deletedLayers.length === 0) {
        this.logger.error({ msg: errorMessage });
        throw new Error(errorMessage);
      }
      return jsonDocument;
    };

    await this.configProvider.updateJson(editJson).catch((err) => {
      const error = err as Error;
      if (error.message !== errorMessage) {
        this.logger.error({ msg: error.message, error });
        throw error;
      }
    });

    return failedLayers;
  }

  @withSpanAsyncV4
  public async updateLayer(layerName: string, layerRequest: ILayerPostRequest): Promise<void> {
    this.logger.info({ msg: `Update layer: '${layerName}' request`, layerRequest });
    await this.validateGridCorrectness();
    const tileMimeFormat = mimeLookup(layerRequest.format) as TilesMimeFormat;
    const isRedisCache = isLayerNameSuffixRedis(layerName);
    let doesHaveRedisCache = false;

    if (isRedisCache) {
      const errorMsg = `layer names that ends with '-redis' are not supported`;
      this.logger.warn({ msg: errorMsg, layerName, layerRequest });
      throw new NotImplementedError(errorMsg);
    }

    const editJson = (jsonDocument: IMapProxyJsonDocument): IMapProxyJsonDocument => {
      const redisCacheName = getRedisCacheName(layerName);
      const mainLayerName = layerName;
      doesHaveRedisCache = jsonDocument.caches[redisCacheName] !== undefined;

      if (jsonDocument.caches[layerName] === undefined) {
        const errorMsg = `Cache name '${layerName}' does not exists`;
        this.logger.error({ msg: errorMsg, layerName, layerRequest });
        throw new NotFoundError(errorMsg);
      }

      if (doesHaveRedisCache) {
        // update existing layer cache values with the new requested layer cache values
        const newRedisCache: IMapProxyCache = this.createRedisCache(redisCacheName, mainLayerName, tileMimeFormat, this.mapproxyConfig);
        this.logger.info({ msg: `updating cache ${redisCacheName}`, newRedisCache });
        jsonDocument.caches[redisCacheName] = newRedisCache;
      }
      const mainSourceCache: IMapProxyCache = this.getCacheValues(layerRequest.cacheType, layerRequest.tilesPath, tileMimeFormat);
      this.logger.info({ msg: `updating cache ${mainLayerName}`, newSourceCache: mainSourceCache });
      jsonDocument.caches[mainLayerName] = mainSourceCache;
      return jsonDocument;
    };

    await this.configProvider.updateJson(editJson);
    this.logger.info(`Successfully updated layer '${layerName}'`);
  }

  public getAllLayerLinkedCaches(baseCacheNames: string[], mapproxyConfiguration: IMapProxyJsonDocument): string[] {
    const linkedCaches: string[] = [];
    const baseCacheNamesDuplicate: string[] = [...baseCacheNames];

    baseCacheNamesDuplicate.forEach((currentCache) => {
      const mainCacheName = isLayerNameSuffixRedis(currentCache) ? getRedisCacheOriginalName(currentCache) : currentCache;
      const redisCacheName = getRedisCacheName(mainCacheName);

      if (mapproxyConfiguration.caches[mainCacheName] != undefined) {
        if (!linkedCaches.includes(mainCacheName)) {
          linkedCaches.push(mainCacheName);
        }
      }

      if (mapproxyConfiguration.caches[redisCacheName] != undefined) {
        if (!linkedCaches.includes(redisCacheName)) {
          linkedCaches.push(redisCacheName);
        }
      }
    });
    return linkedCaches;
  }

  public getCacheValues(cacheSource: string, sourcePath: string, format: string): IMapProxyCache {
    const grids = this.mapproxyConfig.cache.grids.split(',');
    const upscaleTiles = this.mapproxyConfig.cache.upscaleTiles;
    const cacheType = this.getCacheType(cacheSource, sourcePath);

    const cache: IMapProxyCache = {
      sources: [],
      grids: grids,
      upscale_tiles: upscaleTiles,
      cache: cacheType,
      format: format,
      minimize_meta_requests: true,
    };

    return cache;
  }

  public getLayerValues(layerName: string, sourceCacheTitle?: string): IMapProxyLayer {
    const layer: IMapProxyLayer = {
      name: layerName,
      title: layerName,
      sources: [sourceCacheTitle ?? layerName],
    };

    return layer;
  }

  public getCacheType(cacheSource: string, sourcePath: string): ICacheSource {
    let sourceProvider: ICacheProvider;

    switch (cacheSource) {
      case SourceTypes.GPKG:
        sourceProvider = new GpkgSource();
        break;
      case SourceTypes.S3:
        sourceProvider = new S3Source(container);
        break;
      case SourceTypes.FS:
        sourceProvider = new FSSource(container);
        break;
      case SourceTypes.REDIS:
        sourceProvider = new RedisSource(container);
        break;
      default:
        throw new Error(`Invalid cache source: ${cacheSource} has been provided , available values: "geopackage", "s3", "file", "redis"`);
    }

    return sourceProvider.getCacheSource(sourcePath);
  }

  public isCacheTypeValid(cacheType: string): boolean {
    const SourceTypesArray = Object.values(SourceTypes);
    return SourceTypesArray.find((currentCacheType) => currentCacheType === cacheType) ? true : false;
  }

  private addNewCache(jsonDocument: IMapProxyJsonDocument, layerRequest: ILayerPostRequest): void {
    if (this.redisConfig.enabled) {
      this.addNewRedisLayerToConfig(layerRequest, jsonDocument);
    } else {
      this.addNewSourceLayerToConfig(layerRequest, jsonDocument);
    }
  }

  private addNewSourceLayerToConfig(layerRequest: ILayerPostRequest, jsonDocument: IMapProxyJsonDocument): void {
    //creates source cache, and a source layer
    this.logger.info({ msg: `adding ${layerRequest.name} as main layer`, layerRequest });
    const mainCacheTitle = layerRequest.name;
    if (isLayerNameExists(jsonDocument, mainCacheTitle)) {
      const errorMsg = `Layer name '${mainCacheTitle}' already exists`;
      this.logger.error({ msg: errorMsg, layerRequest });
      throw new ConflictError(errorMsg);
    }
    const tileMimeFormat = mimeLookup(layerRequest.format) as TilesMimeFormat;
    const newCache: IMapProxyCache = this.getCacheValues(layerRequest.cacheType, layerRequest.tilesPath, tileMimeFormat);
    this.logger.info(`adding ${mainCacheTitle} to cache list`);
    jsonDocument.caches[mainCacheTitle] = newCache;
    this.addNewLayer(mainCacheTitle, jsonDocument);
  }

  private addNewLayer(layerName: string, jsonDocument: IMapProxyJsonDocument, sourceCacheTitle?: string): void {
    this.logger.info(`adding ${layerName} to layer list`);
    const newLayer: IMapProxyLayer = this.getLayerValues(layerName, sourceCacheTitle);
    jsonDocument.layers.push(newLayer);
  }

  private addNewRedisLayerToConfig(layerRequest: ILayerPostRequest, jsonDocument: IMapProxyJsonDocument): void {
    this.logger.info({ msg: `adding ${layerRequest.name} as redis layer`, layerRequest });
    //creates main cache+redis cache, and a redis layer
    const redisCacheTitle = `${layerRequest.name}-redis`;
    const mainCacheTitle = layerRequest.name;
    if (isLayerNameExists(jsonDocument, mainCacheTitle)) {
      throw new ConflictError(`Layer name '${mainCacheTitle}' already exists`);
    }
    const tileMimeFormat = mimeLookup(layerRequest.format) as TilesMimeFormat;
    this.logger.info(`adding ${mainCacheTitle} to cache list`);
    const sourceCacheBase: IMapProxyCache = this.getCacheValues(layerRequest.cacheType, layerRequest.tilesPath, tileMimeFormat);
    jsonDocument.caches[`${mainCacheTitle}`] = sourceCacheBase;
    this.logger.info(`adding ${redisCacheTitle} to cache list`);
    const redisCache: IMapProxyCache = this.createRedisCache(redisCacheTitle, mainCacheTitle, tileMimeFormat, this.mapproxyConfig);
    jsonDocument.caches[`${redisCacheTitle}`] = redisCache;
    this.addNewLayer(mainCacheTitle, jsonDocument, redisCacheTitle);
  }

  private createRedisCache(originalLayerName: string, sourceLayerName: string, format: string, mapproxyConfig: IMapProxyConfig): IMapProxyCache {
    const firstGridIndex = 0;
    const grids = mapproxyConfig.cache.grids.split(',');
    const sourceProvider = new RedisSource(container, grids[firstGridIndex], originalLayerName);
    const cacheType = sourceProvider.getCacheSource();
    const cache: IMapProxyCache = {
      sources: [sourceLayerName],
      grids: grids,
      cache: cacheType,
      format: format,
    };

    return cache;
  }

  private async validateGridCorrectness(): Promise<void> {
    this.logger.debug({ msg: `validate grid correctness` });
    try {
      const configJson = await this.manager.getConfig();
      if (!(this.mapproxyConfig.cache.grids in configJson.grids)) {
        const message = `grid ${this.mapproxyConfig.cache.grids} doesn't exist in mapproxy global grids list`;
        throw new BadRequestError(message);
      }
    } catch (error) {
      this.logger.error({ msg: `error in adding a layer, grid check failed. `, error });
      throw error;
    }
  }
}

export { LayersManager };
