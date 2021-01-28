/* eslint-disable @typescript-eslint/naming-convention */
import { inject, injectable } from 'tsyringe';
import { Services } from '../../common/constants';
import {
  ILogger,
  ILayerPostRequest,
  IMapProxyCache,
  IMapProxyJsonDocument,
  IMapProxyLayer,
  IMapProxyConfig,
  ILayerToMosaicRequest,
  IReorderMosaicRequest,
} from '../../common/interfaces';
import { mockLayer } from '../../common/data/mock/mockLayer';
import { convertJsonToYaml, convertYamlToJson, replaceYamlFileContent, sortArrayByZIndex } from '../../common/utils';
import { ConfilctError } from '../../common/exceptions/http/confilctError';
import { isLayerNameExists } from '../../common/validations/isLayerNameExists';
import { NotFoundError } from '../../common/exceptions/http/notFoundError';

@injectable()
export class LayersManager {
  public constructor(
    @inject(Services.LOGGER) private readonly logger: ILogger,
    @inject(Services.MAPPROXY) private readonly mapproxyConfig: IMapProxyConfig
  ) {}

  public getLayer(): ILayerPostRequest {
    this.logger.log('info', 'Get layer request');
    return mockLayer;
  }

  public addLayer(layerRequest: ILayerPostRequest): void {
    this.logger.log('info', `Add layer request: ${layerRequest.name}`);
    const jsonDocument: IMapProxyJsonDocument = convertYamlToJson(this.mapproxyConfig.yamlFilePath);

    if (isLayerNameExists(jsonDocument, layerRequest.name)) {
      throw new ConfilctError(`Layer name '${layerRequest.name}' is already exists`);
    }

    const newCache: IMapProxyCache = {
      sources: [],
      grids: this.mapproxyConfig.cache.grids,
      request_format: this.mapproxyConfig.cache.request_format,
      upscale_tiles: this.mapproxyConfig.cache.upscale_tiles,
      cache: {
        type: this.mapproxyConfig.cache.type,
        directory: layerRequest.tilesPath,
        directory_layout: this.mapproxyConfig.cache.directory_layout,
      },
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
    this.logger.log('info', `Successfully added layer: ${layerRequest.name}`);
  }

  public addLayerToMosaic(layerToMosaicRequest: ILayerToMosaicRequest): void {
    this.logger.log('info', `Add layer: ${layerToMosaicRequest.layerName} to mosaic: ${layerToMosaicRequest.mosaicName} request`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const jsonDocument: IMapProxyJsonDocument = convertYamlToJson(this.mapproxyConfig.yamlFilePath);
    if (!isLayerNameExists(jsonDocument, layerToMosaicRequest.layerName)) {
      throw new NotFoundError(`Layer name '${layerToMosaicRequest.layerName}' is not exists`);
    }

    if (!isLayerNameExists(jsonDocument, layerToMosaicRequest.mosaicName)) {
      throw new NotFoundError(`Mosaic name '${layerToMosaicRequest.mosaicName}' is not exists`);
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const mosaicCache: IMapProxyCache = jsonDocument.caches[layerToMosaicRequest.mosaicName];
    mosaicCache.sources.push(layerToMosaicRequest.layerName);

    const yamlContent: string = convertJsonToYaml(jsonDocument);

    replaceYamlFileContent(this.mapproxyConfig.yamlFilePath, yamlContent);
    this.logger.log('info', `Successfully added layer: '${layerToMosaicRequest.layerName}' to mosaic: '${layerToMosaicRequest.mosaicName}'`);
  }

  public reorderMosaic(reorderMosaicRequest: IReorderMosaicRequest): void {
    this.logger.log('info', `Reorder mosaic: ${reorderMosaicRequest.mosaicName} request`);
    const jsonDocument: IMapProxyJsonDocument = convertYamlToJson(this.mapproxyConfig.yamlFilePath);
    if (!isLayerNameExists(jsonDocument, reorderMosaicRequest.mosaicName)) {
      throw new NotFoundError(`Mosaic name '${reorderMosaicRequest.mosaicName}' is not exists`);
    }
    reorderMosaicRequest.layers.forEach((layer) => {
      if (!isLayerNameExists(jsonDocument, layer.layerName)) {
        throw new NotFoundError(`layer name '${layer.layerName}' is not exists`);
      }
    });

    const sortedLayers: string[] = sortArrayByZIndex(reorderMosaicRequest.layers);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const mosaicCache: IMapProxyCache = jsonDocument.caches[reorderMosaicRequest.mosaicName];
    mosaicCache.sources = sortedLayers;

    const yamlContent: string = convertJsonToYaml(jsonDocument);

    replaceYamlFileContent(this.mapproxyConfig.yamlFilePath, yamlContent);
    this.logger.log('info', `Successfully reordered mosaic: '${reorderMosaicRequest.mosaicName}'`);
  }

  public removeLayer(layerName: string): void {
    this.logger.log('info', `Remove layer: ${layerName} request`);
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
    this.logger.log('info', `Successfully removed layer '${layerName}'`);
  }
}
