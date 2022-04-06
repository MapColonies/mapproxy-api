/* eslint-disable @typescript-eslint/naming-convention */
import { container, inject, injectable } from 'tsyringe';
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
import { ConfilctError } from '../../common/exceptions/http/confilctError';
import { isLayerNameExists } from '../../common/validations/isLayerNameExists';
import { NotFoundError } from '../../common/exceptions/http/notFoundError';
import { S3Source } from '../../common/cacheProviders/S3Source';
import { GpkgSource } from '../../common/cacheProviders/gpkgSource';
import { SourceTypes } from '../../common/enums/sourceTypes';
import { FSSource } from '../../common/cacheProviders/fsSource';
import { Logger } from '@map-colonies/js-logger';

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
      throw new NotFoundError(`Layer name '${layerName}' is not exists`);
    }
    const requestedLayer: IMapProxyCache = jsonDocument.caches[layerName] as IMapProxyCache;
    return requestedLayer;
  }

  public async addLayer(layerRequest: ILayerPostRequest): Promise<void> {
    this.logger.info(`Add layer request: ${layerRequest.name}`);
    const jsonDocument: IMapProxyJsonDocument = await this.configProvider.getJson();

    if (isLayerNameExists(jsonDocument, layerRequest.name)) {
      throw new ConfilctError(`Layer name '${layerRequest.name}' is already exists`);
    }

    const newCache: IMapProxyCache = this.getCacheValues(layerRequest.cacheType, layerRequest.tilesPath);
    const newLayer: IMapProxyLayer = this.getLayerValues(layerRequest.name);

    jsonDocument.caches[layerRequest.name] = newCache;
    jsonDocument.layers.push(newLayer);

    await this.configProvider.updateJson(jsonDocument);
    this.logger.info(`Successfully added layer: ${layerRequest.name}`);
  }

  public async addLayerToMosaic(mosaicName: string, layerToMosaicRequest: ILayerToMosaicRequest): Promise<void> {
    this.logger.info(`Add layer: ${layerToMosaicRequest.layerName} to mosaic: ${mosaicName} request`);
    const jsonDocument: IMapProxyJsonDocument = await this.configProvider.getJson();
    console.log(jsonDocument);

    if (!isLayerNameExists(jsonDocument, layerToMosaicRequest.layerName)) {
      throw new NotFoundError(`Layer name '${layerToMosaicRequest.layerName}' is not exists`);
    }

    if (!isLayerNameExists(jsonDocument, mosaicName)) {
      throw new NotFoundError(`Mosaic name '${mosaicName}' is not exists`);
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const mosaicCache: IMapProxyCache = jsonDocument.caches[mosaicName];
    mosaicCache.sources.push(layerToMosaicRequest.layerName);
    
    await this.configProvider.updateJson(jsonDocument);
    this.logger.info(`Successfully added layer: '${layerToMosaicRequest.layerName}' to mosaic: '${mosaicName}'`);
  }

  public async updateMosaic(mosaicName: string, updateMosaicRequest: IUpdateMosaicRequest): Promise<void> {
    this.logger.info(`Update mosaic: ${mosaicName} request`);
    const jsonDocument: IMapProxyJsonDocument = await this.configProvider.getJson();

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

    await this.configProvider.updateJson(jsonDocument);
    this.logger.info(`Successfully updated mosaic: '${mosaicName}'`);
  }

  public async removeLayer(layersName: string[]): Promise<string[] | void> {
    this.logger.info(`Remove layers request for: [${layersName.join(',')}]`);
    const jsonDocument: IMapProxyJsonDocument = await this.configProvider.getJson();
    const failedLayers: string[] = [];
    let updateCounter = 0;

    layersName.forEach((layerName) => {
      // remove requested layer cache source from cache list
      delete jsonDocument.caches[layerName];
      // remove requested layer from layers array
      const requestedLayerIndex: number = jsonDocument.layers.findIndex((layer) => layer.name === layerName);
      const negativeResult = -1;
      if (requestedLayerIndex !== negativeResult) {
        jsonDocument.layers.splice(requestedLayerIndex, 1);
        updateCounter++;
        this.logger.info(`Successfully removed layers '${layerName}'`);
      } else {
        failedLayers.push(layerName);
        this.logger.info(`Layer: ['${layerName}'] is not exists`);
      }
    });
    if (updateCounter > 0) {
      await this.configProvider.updateJson(jsonDocument);
    }
    return failedLayers;
  }

  public async updateLayer(layerName: string, layerRequest: ILayerPostRequest): Promise<void> {
    this.logger.info(`Update layer: '${layerName}' request`);
    const jsonDocument: IMapProxyJsonDocument = await this.configProvider.getJson();

    if (!isLayerNameExists(jsonDocument, layerName)) {
      throw new NotFoundError(`Layer name '${layerName}' is not exists`);
    }

    const newCache: IMapProxyCache = this.getCacheValues(layerRequest.cacheType, layerRequest.tilesPath);
    const newLayer: IMapProxyLayer = this.getLayerValues(layerName);

    // update existing layer cache values with the new requested layer cache values
    jsonDocument.caches[layerName] = newCache;
    // update existing layer values with the new requested layer values
    const requestedLayerIndex: number = jsonDocument.layers.findIndex((layer) => layer.name === layerName);
    const negativeResult = -1;
    if (requestedLayerIndex !== negativeResult) {
      jsonDocument.layers[requestedLayerIndex] = newLayer;
    }
    //console.log(jsonDocument)
    await this.configProvider.updateJson(jsonDocument);
    this.logger.info(`Successfully updated layer '${layerName}'`);
  }

  public getCacheValues(cacheSource: string, sourcePath: string): IMapProxyCache {
    const grids = this.mapproxyConfig.cache.grids.split(',');
    const requestFormat = this.mapproxyConfig.cache.requestFormat;
    const upscaleTiles = this.mapproxyConfig.cache.upscaleTiles;
    const cacheType = this.getCacheType(cacheSource, sourcePath);

    const cache: IMapProxyCache = {
      sources: [],
      grids: grids,
      request_format: requestFormat,
      upscale_tiles: upscaleTiles,
      cache: cacheType,
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
      default:
        throw new Error(`Invalid cache source: ${cacheSource} has been provided , available values: "geopackage", "s3", "file"`);
    }

    return sourceProvider.getCacheSource(sourcePath);
  }
}

export { LayersManager };
