/* eslint-disable @typescript-eslint/naming-convention */
import { container, inject, injectable } from 'tsyringe';
import { Logger } from '@map-colonies/js-logger';
import { ConflictError, NotFoundError } from '@map-colonies/error-types';
import { lookup as mimeLookup, TilesMimeFormat } from '@map-colonies/types';
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
} from '../../common/interfaces';
// import { sortArrayByZIndex } from '../../common/utils';
import { isLayerNameExists } from '../../common/validations/isLayerNameExists';
import { S3Source } from '../../common/cacheProviders/S3Source';
import { GpkgSource } from '../../common/cacheProviders/gpkgSource';
import { FSSource } from '../../common/cacheProviders/fsSource';
import { SourceTypes } from '../../common/enums';
import { RedisSource } from '../../common/cacheProviders/redisSource';

@injectable()
class LayersManager {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.MAPPROXY) private readonly mapproxyConfig: IMapProxyConfig,
    @inject(SERVICES.REDISCONFIG) private readonly redisConfig: IRedisConfig,
    @inject(SERVICES.CONFIGPROVIDER) private readonly configProvider: IConfigProvider
  ) {}
  public async getLayer(layerName: string): Promise<IMapProxyCache> {
    const jsonDocument: IMapProxyJsonDocument = await this.configProvider.getJson();

    if (!isLayerNameExists(jsonDocument, layerName)) {
      throw new NotFoundError(`Layer name '${layerName}' does not exist`);
    }
    const requestedLayer: IMapProxyCache = jsonDocument.caches[layerName] as IMapProxyCache;
    return requestedLayer;
  }

  public async addLayer(layerRequest: ILayerPostRequest): Promise<void> {
    const editJson = (jsonDocument: IMapProxyJsonDocument): IMapProxyJsonDocument => {
      this.addNewCache(jsonDocument, layerRequest);

      return jsonDocument;
    };

    await this.configProvider.updateJson(editJson);
  }

  // public async addLayerToMosaic(mosaicName: string, layerToMosaicRequest: ILayerToMosaicRequest): Promise<void> {
  //   this.logger.info(`Add layer: ${layerToMosaicRequest.layerName} to mosaic: ${mosaicName} request`);

  //   const editJson = (jsonDocument: IMapProxyJsonDocument): IMapProxyJsonDocument => {
  //     if (!isLayerNameExists(jsonDocument, layerToMosaicRequest.layerName)) {
  //       throw new NotFoundError(`Layer name '${layerToMosaicRequest.layerName}' is not exists`);
  //     }

  //     if (!isLayerNameExists(jsonDocument, mosaicName)) {
  //       throw new NotFoundError(`Mosaic name '${mosaicName}' is not exists`);
  //     }
  //     // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  //     const mosaicCache: IMapProxyCache = jsonDocument.caches[mosaicName];
  //     mosaicCache.sources.push(layerToMosaicRequest.layerName);
  //     return jsonDocument;
  //   };

  //   await this.configProvider.updateJson(editJson);
  //   this.logger.info(`Successfully added layer: '${layerToMosaicRequest.layerName}' to mosaic: '${mosaicName}'`);
  // }

  // public async updateMosaic(mosaicName: string, updateMosaicRequest: IUpdateMosaicRequest): Promise<void> {
  //   this.logger.info(`Update mosaic: ${mosaicName} request`);

  //   const editJson = (jsonDocument: IMapProxyJsonDocument): IMapProxyJsonDocument => {
  //     if (!isLayerNameExists(jsonDocument, mosaicName)) {
  //       throw new NotFoundError(`Mosaic name '${mosaicName}' is not exists`);
  //     }
  //     updateMosaicRequest.layers.forEach((layer) => {
  //       if (!isLayerNameExists(jsonDocument, layer.layerName)) {
  //         throw new NotFoundError(`Layer name '${layer.layerName}' is not exists`);
  //       }
  //     });

  //     const sortedLayers: string[] = sortArrayByZIndex(updateMosaicRequest.layers);

  //     // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  //     const mosaicCache: IMapProxyCache = jsonDocument.caches[mosaicName];
  //     mosaicCache.sources = sortedLayers;
  //     return jsonDocument;
  //   };

  //   await this.configProvider.updateJson(editJson);
  //   this.logger.info(`Successfully updated mosaic: '${mosaicName}'`);
  // }

  public getAllLinkedCaches(baseCacheNames: string[], mapproxyConfiguration: IMapProxyJsonDocument): string[] {
    const linkedCaches: string[] = [];
    const baseCacheNamesDuplicate: string[] = [...baseCacheNames];

    baseCacheNamesDuplicate.forEach((currentCache) => {
      const mainCacheName = currentCache.endsWith('-redis') ? currentCache.replace('-redis', '') : currentCache;
      const redisCacheName = currentCache.endsWith('-redis') ? currentCache : currentCache.replace('-redis', '');

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

  public async removeLayer(layersName: string[]): Promise<string[] | void> {
    this.logger.info(`Remove layers request for: [${layersName.join(',')}]`);
    const errorMessage = 'no valid layers to delete';
    let failedLayers;
    const deletedLayers: string[] = [];

    const editJson = (jsonDocument: IMapProxyJsonDocument): IMapProxyJsonDocument => {
      let updateCounter = 0;
      const allLinkedCaches = this.getAllLinkedCaches(layersName, jsonDocument);
      allLinkedCaches.forEach((cacheName) => {
        // remove requested layer cache source from cache list
        delete jsonDocument.caches[cacheName];
        // remove requested layer from layers array
        const requestedLayerIndex: number = jsonDocument.layers.findIndex((layer) => layer.name === cacheName);
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        if (requestedLayerIndex !== -1) {
          jsonDocument.layers.splice(requestedLayerIndex, 1);
          updateCounter++;
          this.logger.info(`Successfully removed layer '${cacheName}'`);
          deletedLayers.concat([cacheName]);
        }
      });
      failedLayers = layersName.filter((layerName) => !allLinkedCaches.includes(layerName));
      if (failedLayers.length !== 0) {
        const notFoundMessege = `Layers: ['${failedLayers.join(',')}'] were not found`;
        this.logger.error(notFoundMessege);
        throw new NotFoundError(notFoundMessege);
      }
      if (updateCounter === 0) {
        throw new Error(errorMessage);
      }
      return jsonDocument;
    };

    await this.configProvider.updateJson(editJson).catch((err) => {
      const error = err as Error;
      if (error.message !== errorMessage) {
        throw error;
      }
    });

    return deletedLayers;
  }

  public async updateLayer(layerName: string, layerRequest: ILayerPostRequest): Promise<void> {
    this.logger.info({ msg: `Update layer: '${layerName}' request`, layerRequest });
    const tileMimeFormat = mimeLookup(layerRequest.format) as TilesMimeFormat;
    const isRedisCache = layerName.endsWith('-redis');
    let doesHaveRedisCache = false;

    const editJson = (jsonDocument: IMapProxyJsonDocument): IMapProxyJsonDocument => {
      let newLayer: IMapProxyLayer;
      let redisLayerName: string = layerName;
      let mainLayerName = layerName.replace('-redis', '');

      if (jsonDocument.caches[layerName] == undefined) {
        throw new NotFoundError(`Cache name '${layerName}' does not exists`);
      }

      if (!isRedisCache) {
        mainLayerName = layerName;
        redisLayerName = `${layerName}-redis`;
        doesHaveRedisCache = jsonDocument.caches[redisLayerName] != undefined;
      }

      if (isRedisCache || doesHaveRedisCache) {
        // update existing layer cache values with the new requested layer cache values
        const newRedisCache: IMapProxyCache = this.createRedisCache(redisLayerName, mainLayerName, tileMimeFormat, this.mapproxyConfig);
        jsonDocument.caches[redisLayerName] = newRedisCache;
        // update existing layer values with the new requested layer values
        newLayer = this.getLayerValues(redisLayerName);
        const redisLayerIndex: number = jsonDocument.layers.findIndex((layer) => layer.name === redisLayerName);
        jsonDocument.layers[redisLayerIndex] = newLayer;
      } else {
        newLayer = this.getLayerValues(mainLayerName);
        const sourceLayerNameIndex: number = jsonDocument.layers.findIndex((layer) => layer.name === mainLayerName);
        jsonDocument.layers[sourceLayerNameIndex] = newLayer;
      }
      const newSourceCache: IMapProxyCache = this.getCacheValues(layerRequest.cacheType, layerRequest.tilesPath, tileMimeFormat);
      jsonDocument.caches[mainLayerName] = newSourceCache;

      return jsonDocument;
    };

    await this.configProvider.updateJson(editJson);
    this.logger.info(`Successfully updated layer '${layerName}'`);
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
      throw new ConflictError(`Layer name '${mainCacheTitle}' already exists`);
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
}

export { LayersManager };
