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
import { NoContentError } from '../../common/exceptions/http/noContentError';

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
    const jsonDocument: IMapProxyJsonDocument | undefined = convertYamlToJson(this.mapproxyConfig.yamlFilePath);
    if (!isLayerNameExists(jsonDocument, layerToMosaicRequest.layerName)) {
      throw new NoContentError(`Layer name '${layerToMosaicRequest.layerName}' is not exists`);
    }

    if (!isLayerNameExists(jsonDocument, layerToMosaicRequest.mosaicName)) {
      throw new NoContentError(`Mosaic name '${layerToMosaicRequest.mosaicName}' is not exists`);
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const mosaicCache: IMapProxyCache = jsonDocument.caches[layerToMosaicRequest.mosaicName];
    mosaicCache.sources.push(layerToMosaicRequest.layerName);

    const yamlContent: string | undefined = convertJsonToYaml(jsonDocument);

    replaceYamlFileContent(this.mapproxyConfig.yamlFilePath, yamlContent);
    this.logger.log('info', `Successfully added layer: '${layerToMosaicRequest.layerName}' to mosaic: '${layerToMosaicRequest.mosaicName}'`);
  }

  public reorderMosaic(reorderMosaicRequest: IReorderMosaicRequest): void {
    this.logger.log('info', `Reorder mosaic: ${reorderMosaicRequest.mosaicName} request`);
    const jsonDocument: IMapProxyJsonDocument | undefined = convertYamlToJson(this.mapproxyConfig.yamlFilePath);
    if (!isLayerNameExists(jsonDocument, reorderMosaicRequest.mosaicName)) {
      throw new NoContentError(`Mosaic name '${reorderMosaicRequest.mosaicName}' is not exists`);
    }
    reorderMosaicRequest.layers.forEach((layer) => {
      if (!isLayerNameExists(jsonDocument, layer.layerName)) {
        throw new NoContentError(`layer name '${layer.layerName}' is not exists`);
      }
    });

    const sortedLayers: string[] = sortArrayByZIndex(reorderMosaicRequest.layers);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const mosaicCache: IMapProxyCache = jsonDocument.caches[reorderMosaicRequest.mosaicName];
    mosaicCache.sources = sortedLayers;

    const yamlContent: string | undefined = convertJsonToYaml(jsonDocument);

    replaceYamlFileContent(this.mapproxyConfig.yamlFilePath, yamlContent);
    this.logger.log('info', `Successfully reordered mosaic: '${reorderMosaicRequest.mosaicName}'`);
  }
}
