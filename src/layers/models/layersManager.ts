/* eslint-disable @typescript-eslint/naming-convention */
import { container, inject, injectable } from 'tsyringe';
import { Services } from '../../common/constants';
import {
  ILogger,
  ILayerPostRequest,
  IMapProxyCache,
  IMapProxyJsonDocument,
  IMapProxyLayer,
  IMapProxyConfig,
  IUpdateMosaicRequest,
  ILayerToMosaicRequest,
  IFileProvider,
  ICacheProvider,
  IS3Source,
  IGpkgSource,
} from '../../common/interfaces';
import { convertJsonToYaml, convertYamlToJson, replaceYamlFileContent, sortArrayByZIndex, getFileExtension } from '../../common/utils';
import { ConfilctError } from '../../common/exceptions/http/confilctError';
import { isLayerNameExists } from '../../common/validations/isLayerNameExists';
import { NotFoundError } from '../../common/exceptions/http/notFoundError';
import { S3Source } from '../../common/S3Source';
import { GpkgSource } from '../../common/gpkgSource';
import { BadRequestError } from '../../common/exceptions/http/badRequestError';

@injectable()
export class LayersManager {
  public constructor(
    @inject(Services.LOGGER) private readonly logger: ILogger,
    @inject(Services.MAPPROXY) private readonly mapproxyConfig: IMapProxyConfig,
    @inject(Services.FILEPROVIDER) private readonly fileProvider: IFileProvider
  ) {}

  public async getLayer(layerName: string): Promise<IMapProxyCache> {
    await this.fileProvider.getFile(this.mapproxyConfig.yamlFilePath);
    const jsonDocument: IMapProxyJsonDocument = convertYamlToJson(this.mapproxyConfig.yamlFilePath);
    if (!isLayerNameExists(jsonDocument, layerName)) {
      throw new NotFoundError(`Layer name '${layerName}' is not exists`);
    }
    const requestedLayer: IMapProxyCache = jsonDocument.caches[layerName] as IMapProxyCache;
    return requestedLayer;
  }

  public async addLayer(layerRequest: ILayerPostRequest): Promise<void> {
    this.logger.log('info', `Add layer request: ${layerRequest.name}`);
    await this.fileProvider.getFile(this.mapproxyConfig.yamlFilePath);
    const jsonDocument: IMapProxyJsonDocument = convertYamlToJson(this.mapproxyConfig.yamlFilePath);

    if (isLayerNameExists(jsonDocument, layerRequest.name)) {
      throw new ConfilctError(`Layer name '${layerRequest.name}' is already exists`);
    }

    const newCache: IMapProxyCache = {
      sources: [],
      grids: this.mapproxyConfig.cache.grids,
      request_format: this.mapproxyConfig.cache.requestFormat,
      upscale_tiles: this.mapproxyConfig.cache.upscaleTiles,
      cache: this.getCacheSource(layerRequest.tilesPath)
    };
    const newLayer: IMapProxyLayer = {
      name: layerRequest.name,
      title: layerRequest.description,
      sources: [layerRequest.name],
    };
    jsonDocument.caches[layerRequest.name] = newCache;
    jsonDocument.layers.push(newLayer);

    const yamlContent = convertJsonToYaml(jsonDocument);
    replaceYamlFileContent(this.mapproxyConfig.yamlFilePath, yamlContent);
    await this.fileProvider.uploadFile(this.mapproxyConfig.yamlFilePath);
    this.logger.log('info', `Successfully added layer: ${layerRequest.name}`);
  }

  public async addLayerToMosaic(mosaicName: string, layerToMosaicRequest: ILayerToMosaicRequest): Promise<void> {
    this.logger.log('info', `Add layer: ${layerToMosaicRequest.layerName} to mosaic: ${mosaicName} request`);
    await this.fileProvider.getFile(this.mapproxyConfig.yamlFilePath);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const jsonDocument: IMapProxyJsonDocument = convertYamlToJson(this.mapproxyConfig.yamlFilePath);
    if (!isLayerNameExists(jsonDocument, layerToMosaicRequest.layerName)) {
      throw new NotFoundError(`Layer name '${layerToMosaicRequest.layerName}' is not exists`);
    }

    if (!isLayerNameExists(jsonDocument, mosaicName)) {
      throw new NotFoundError(`Mosaic name '${mosaicName}' is not exists`);
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const mosaicCache: IMapProxyCache = jsonDocument.caches[mosaicName];
    mosaicCache.sources.push(layerToMosaicRequest.layerName);

    const yamlContent: string = convertJsonToYaml(jsonDocument);

    replaceYamlFileContent(this.mapproxyConfig.yamlFilePath, yamlContent);
    await this.fileProvider.uploadFile(this.mapproxyConfig.yamlFilePath);
    this.logger.log('info', `Successfully added layer: '${layerToMosaicRequest.layerName}' to mosaic: '${mosaicName}'`);
  }

  public async updateMosaic(mosaicName: string, updateMosaicRequest: IUpdateMosaicRequest): Promise<void> {
    this.logger.log('info', `Update mosaic: ${mosaicName} request`);
    await this.fileProvider.getFile(this.mapproxyConfig.yamlFilePath);
    const jsonDocument: IMapProxyJsonDocument = convertYamlToJson(this.mapproxyConfig.yamlFilePath);
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

    const yamlContent: string = convertJsonToYaml(jsonDocument);

    replaceYamlFileContent(this.mapproxyConfig.yamlFilePath, yamlContent);
    await this.fileProvider.uploadFile(this.mapproxyConfig.yamlFilePath);
    this.logger.log('info', `Successfully updated mosaic: '${mosaicName}'`);
  }

  public async removeLayer(layerName: string): Promise<void> {
    this.logger.log('info', `Remove layer: ${layerName} request`);
    await this.fileProvider.getFile(this.mapproxyConfig.yamlFilePath);
    const jsonDocument: IMapProxyJsonDocument = convertYamlToJson(this.mapproxyConfig.yamlFilePath);
    if (!isLayerNameExists(jsonDocument, layerName)) {
      throw new NotFoundError(`Layer name '${layerName}' is not exists`);
    }
    // remove requested layer cache source from cache list
    delete jsonDocument.caches[layerName];
    // remove requested layer from layers array
    const requestedLayerIndex: number = jsonDocument.layers.findIndex((layer) => layer.name === layerName);
    const negativeResult = -1;
    if (requestedLayerIndex !== negativeResult) {
      jsonDocument.layers.splice(requestedLayerIndex, 1);
    }

    const yamlContent = convertJsonToYaml(jsonDocument);
    replaceYamlFileContent(this.mapproxyConfig.yamlFilePath, yamlContent);
    await this.fileProvider.uploadFile(this.mapproxyConfig.yamlFilePath);
    this.logger.log('info', `Successfully removed layer '${layerName}'`);
  }

  public async updateLayer(layerName: string, layerRequest: ILayerPostRequest): Promise<void> {
    this.logger.log('info', `Update layer: '${layerName}' request`);
    await this.fileProvider.getFile(this.mapproxyConfig.yamlFilePath);
    const jsonDocument: IMapProxyJsonDocument = convertYamlToJson(this.mapproxyConfig.yamlFilePath);
    if (!isLayerNameExists(jsonDocument, layerName)) {
      throw new NotFoundError(`Layer name '${layerName}' is not exists`);
    }

    const newCache: IMapProxyCache = {
      sources: [],
      grids: this.mapproxyConfig.cache.grids,
      request_format: this.mapproxyConfig.cache.requestFormat,
      upscale_tiles: this.mapproxyConfig.cache.upscaleTiles,
      cache: this.getCacheSource(layerRequest.tilesPath)
    };
    const newLayer: IMapProxyLayer = {
      name: layerName,
      title: layerRequest.description,
      sources: [layerRequest.name],
    };
    // update existing layer cache values with the new requested layer cache values
    jsonDocument.caches[layerName] = newCache;
    // update existing layer values with the new requested layer values
    const requestedLayerIndex: number = jsonDocument.layers.findIndex((layer) => layer.name === layerName);
    const negativeResult = -1;
    if (requestedLayerIndex !== negativeResult) {
      jsonDocument.layers[requestedLayerIndex] = newLayer;
    }

    const yamlContent = convertJsonToYaml(jsonDocument);
    replaceYamlFileContent(this.mapproxyConfig.yamlFilePath, yamlContent);
    await this.fileProvider.uploadFile(this.mapproxyConfig.yamlFilePath);
    this.logger.log('info', `Successfully updated layer '${layerName}'`);
  }

  public getCacheSource(sourcePath: string): IS3Source | IGpkgSource {
    let sourceProvider: ICacheProvider | undefined;
    const filePathExtension = getFileExtension(sourcePath);
    console.log(filePathExtension);
    if (filePathExtension === this.mapproxyConfig.cache.gpkgExt) { 
      sourceProvider = new GpkgSource(container)
    } 
    else if (filePathExtension === '') {
      sourceProvider = new S3Source(container)
    }
    if(sourceProvider === undefined)
     throw new Error('Invalid source provider due to invalid source path');
     
    return sourceProvider.getCacheSource(sourcePath);
  }
};
