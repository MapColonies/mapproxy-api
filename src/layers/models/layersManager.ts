/* eslint-disable @typescript-eslint/naming-convention */
import { container, inject, injectable } from 'tsyringe';
import config from 'config';
import { Logger } from '@map-colonies/js-logger';
import { ConflictError, NotFoundError } from '@map-colonies/error-types';
import { TileOutputFormat } from '@map-colonies/mc-model-types';
import { SERVICES } from '../../common/constants';
import {
  ILayerPostRequest,
  IMapProxyCache,
  IMapProxyJsonDocument,
  IMapProxyLayer,
  IMapProxyConfig,
  IUpdateMosaicRequest,
  ILayerToMosaicRequest,
  IConfigProvider,
  ICacheProvider,
  ICacheSource,
} from '../../common/interfaces';
import { sortArrayByZIndex } from '../../common/utils';
import { isLayerNameExists } from '../../common/validations/isLayerNameExists';
import { S3Source } from '../../common/cacheProviders/S3Source';
import { GpkgSource } from '../../common/cacheProviders/gpkgSource';
import { FSSource } from '../../common/cacheProviders/fsSource';
import { SourceTypes, TileFormat } from '../../common/enums';
import { RedisSource } from '../../common/cacheProviders/redisSource';

@injectable()
class LayersManager {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.MAPPROXY) private readonly mapproxyConfig: IMapProxyConfig,
    @inject(SERVICES.CONFIGPROVIDER) private readonly configProvider: IConfigProvider
  ) {}

  public async getLayer(layerName: string): Promise<IMapProxyCache> {
    const jsonDocument: IMapProxyJsonDocument = await this.configProvider.getJson();

    if (!isLayerNameExists(jsonDocument, layerName)) {
      throw new NotFoundError(`Layer name '${layerName}' does not exists`);
    }
    const requestedLayer: IMapProxyCache = jsonDocument.caches[layerName] as IMapProxyCache;
    return requestedLayer;
  }

  public async addLayer(layerRequest: ILayerPostRequest): Promise<void> {
    const sourceLayerName = `${layerRequest.name}-source`;

    this.logger.info(`Add layer request: ${sourceLayerName}`);

    const editJson = (jsonDocument: IMapProxyJsonDocument): IMapProxyJsonDocument => {
      if (isLayerNameExists(jsonDocument, sourceLayerName)) {
        throw new ConflictError(`Layer name '${sourceLayerName}' already exists`);
      }
      const tileFormat = this.mapToTileFormat(layerRequest.format);
      const isRedisEnabled = config.get<boolean>('redis.enabled');
      if (isRedisEnabled) {
        //create redis source+layer and source cache;
        const redisLayerName = layerRequest.name;
        const baseCache: IMapProxyCache = this.getCacheValues(layerRequest.cacheType, layerRequest.tilesPath, tileFormat);
        jsonDocument.caches[`${sourceLayerName}`] = baseCache;
        const redisCache: IMapProxyCache = this.createRedisCache(redisLayerName, sourceLayerName, tileFormat, this.mapproxyConfig);
        jsonDocument.caches[`${redisLayerName}`] = redisCache;
        const redisLayer = this.getLayerValues(redisLayerName);
        jsonDocument.layers.push(redisLayer);
      } else {
        //create cache and layer
        const newCache: IMapProxyCache = this.getCacheValues(layerRequest.cacheType, layerRequest.tilesPath, tileFormat);
        jsonDocument.caches[sourceLayerName] = newCache;
        const newLayer: IMapProxyLayer = this.getLayerValues(sourceLayerName);
        jsonDocument.layers.push(newLayer);
      }

      return jsonDocument;
    };

    await this.configProvider.updateJson(editJson);
    this.logger.info(`Successfully added layer: ${sourceLayerName}`);
  }

  public async addLayerToMosaic(mosaicName: string, layerToMosaicRequest: ILayerToMosaicRequest): Promise<void> {
    this.logger.info(`Add layer: ${layerToMosaicRequest.layerName} to mosaic: ${mosaicName} request`);

    const editJson = (jsonDocument: IMapProxyJsonDocument): IMapProxyJsonDocument => {
      if (!isLayerNameExists(jsonDocument, layerToMosaicRequest.layerName)) {
        throw new NotFoundError(`Layer name '${layerToMosaicRequest.layerName}' is not exists`);
      }

      if (!isLayerNameExists(jsonDocument, mosaicName)) {
        throw new NotFoundError(`Mosaic name '${mosaicName}' is not exists`);
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const mosaicCache: IMapProxyCache = jsonDocument.caches[mosaicName];
      mosaicCache.sources.push(layerToMosaicRequest.layerName);
      return jsonDocument;
    };

    await this.configProvider.updateJson(editJson);
    this.logger.info(`Successfully added layer: '${layerToMosaicRequest.layerName}' to mosaic: '${mosaicName}'`);
  }

  public async updateMosaic(mosaicName: string, updateMosaicRequest: IUpdateMosaicRequest): Promise<void> {
    this.logger.info(`Update mosaic: ${mosaicName} request`);

    const editJson = (jsonDocument: IMapProxyJsonDocument): IMapProxyJsonDocument => {
      if (!isLayerNameExists(jsonDocument, mosaicName)) {
        throw new NotFoundError(`Mosaic name '${mosaicName}' is not exists`);
      }
      updateMosaicRequest.layers.forEach((layer) => {
        if (!isLayerNameExists(jsonDocument, layer.layerName)) {
          throw new NotFoundError(`Layer name '${layer.layerName}' is not exists`);
        }
      });

      const sortedLayers: string[] = sortArrayByZIndex(updateMosaicRequest.layers);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const mosaicCache: IMapProxyCache = jsonDocument.caches[mosaicName];
      mosaicCache.sources = sortedLayers;
      return jsonDocument;
    };

    await this.configProvider.updateJson(editJson);
    this.logger.info(`Successfully updated mosaic: '${mosaicName}'`);
  }

  public getAllLinkedCaches(baseCacheNames: string[], mapproxyConfiguration: IMapProxyJsonDocument): string[] {
    const linkedCaches: string[] = [];
    const baseCacheNamesDuplicate: string[] = [...baseCacheNames];
    baseCacheNamesDuplicate.forEach((currentCache) => {
      if (mapproxyConfiguration.caches[currentCache]) {
        if (currentCache.endsWith('-source')) {
          if (linkedCaches.indexOf(currentCache) == -1) {
            linkedCaches.push(currentCache);
          }
        } else {
          linkedCaches.push(currentCache);
          if (linkedCaches.indexOf(`${currentCache}-source`) == -1) {
            linkedCaches.push(`${currentCache}-source`);
          }
        }
      }
    });
    return linkedCaches;
  }

  public async removeLayer(layersName: string[]): Promise<string[] | void> {
    this.logger.info(`Remove layers request for: [${layersName.join(',')}]`);
    const errorMessage = 'no valid layers to delete';
    let failedLayers;

    const editJson = (jsonDocument: IMapProxyJsonDocument): IMapProxyJsonDocument => {
      let updateCounter = 0;
      const allLinkedCaches = this.getAllLinkedCaches(layersName, jsonDocument);
      allLinkedCaches.forEach((cacheName) => {
        // remove requested layer cache source from cache list
        delete jsonDocument.caches[cacheName];
        // remove requested layer from layers array
        const requestedLayerIndex: number = jsonDocument.layers.findIndex((layer) => layer.name === cacheName && !cacheName.endsWith('-source'));
        if (requestedLayerIndex !== -1) {
          jsonDocument.layers.splice(requestedLayerIndex, 1);
          updateCounter++;
          this.logger.info(`Successfully removed layer '${cacheName}'`);
        }
      });
      failedLayers = layersName.filter(x => !allLinkedCaches.includes(x));
      this.logger.info(`Layers: ['${failedLayers.join(',')}'] do not exist`);

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

    return failedLayers;
  }

  public async updateLayer(layerName: string, layerRequest: ILayerPostRequest): Promise<void> {
    this.logger.info(`Update layer: '${layerName}' request`);
    const tileFormat = this.mapToTileFormat(layerRequest.format);
    const newCache: IMapProxyCache = this.getCacheValues(layerRequest.cacheType, layerRequest.tilesPath, tileFormat);
    const newLayer: IMapProxyLayer = this.getLayerValues(layerName);

    const editJson = (jsonDocument: IMapProxyJsonDocument): IMapProxyJsonDocument => {
      if (!isLayerNameExists(jsonDocument, layerName)) {
        throw new NotFoundError(`Layer name '${layerName}' is not exists`);
      }

      // update existing layer cache values with the new requested layer cache values
      jsonDocument.caches[layerName] = newCache;
      // update existing layer values with the new requested layer values
      const requestedLayerIndex: number = jsonDocument.layers.findIndex((layer) => layer.name === layerName);
      if (requestedLayerIndex !== -1) {
        jsonDocument.layers[requestedLayerIndex] = newLayer;
      }
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

  public getLayerValues(layerName: string): IMapProxyLayer {
    const layer: IMapProxyLayer = {
      name: layerName,
      title: layerName,
      sources: [layerName],
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

  private createRedisCache(originalLayerName: string, sourceLayerName: string, format: string, mapproxyConfig: IMapProxyConfig): IMapProxyCache {
    const firstGridIndex = 0;
    const sourceProvider = new RedisSource(container);
    const grids = mapproxyConfig.cache.grids.split(',');
    const cacheType = sourceProvider.getCacheSource();
    if (cacheType.prefix != null) {
      cacheType.prefix = `${cacheType.prefix}${originalLayerName}_${grids[firstGridIndex]}`;
    }

    const cache: IMapProxyCache = {
      sources: [sourceLayerName],
      grids: grids,
      cache: cacheType,
      format: format,
    };

    return cache;
  }

  private mapToTileFormat(tileOutputFormat: TileOutputFormat): TileFormat {
    if (tileOutputFormat === TileOutputFormat.JPEG) {
      return TileFormat.JPEG;
    } else {
      return TileFormat.PNG;
    }
  }
}

export { LayersManager };
