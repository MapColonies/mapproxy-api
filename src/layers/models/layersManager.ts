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
  ILayerToBestRequest,
} from '../../common/interfaces';
import { mockLayer } from '../../common/data/mock/mockLayer';
import { convertJsonToYaml, convertYamlToJson, replaceYamlFileContent } from '../../common/utils';
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

  public addLayerToBest(layerToBestRequest: ILayerToBestRequest): void {
    this.logger.log('info', `Add layer: ${layerToBestRequest.layerName} to best: ${layerToBestRequest.bestName} request`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const jsonDocument: IMapProxyJsonDocument | undefined = convertYamlToJson(this.mapproxyConfig.yamlFilePath);
    if (!isLayerNameExists(jsonDocument, layerToBestRequest.layerName)) {
      throw new NoContentError(`Layer name '${layerToBestRequest.layerName}' is not exists`);
    }

    if (!isLayerNameExists(jsonDocument, layerToBestRequest.bestName)) {
      throw new NoContentError(`Best name '${layerToBestRequest.bestName}' is not exists`);
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const bestCache: IMapProxyCache = jsonDocument.caches[layerToBestRequest.bestName];
    bestCache.sources.push(layerToBestRequest.layerName);

    const yamlContent: string | undefined = convertJsonToYaml(jsonDocument);

    replaceYamlFileContent(this.mapproxyConfig.yamlFilePath, yamlContent);
    this.logger.log('info', `Successfully added layer: '${layerToBestRequest.layerName}' to best: '${layerToBestRequest.bestName}'`);
  }
}
