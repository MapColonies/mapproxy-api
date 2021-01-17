/* eslint-disable @typescript-eslint/naming-convention */
import { inject, injectable } from 'tsyringe';
import { Services } from '../../common/constants';
import { ILogger, ILayerPostRequest, IMapProxyCache, IMapProxyJsonDocument, IMapProxyLayer, IMapProxyConfig } from '../../common/interfaces';
import { mockLayer } from '../../common/data/mock/mockLayer';
import { convertJsonToYaml, convertYamlToJson, isLayerNameExists, replaceYamlFileContent } from '../../common/utils';
import { ConfilctError } from '../../common/exceptions/http/confilctError';
@injectable()
export class LayersManager {
  public constructor(
    @inject(Services.LOGGER) private readonly logger: ILogger,
    @inject(Services.MAPPROXY) private readonly mapproxyConfig: IMapProxyConfig
  ) {}

  public getLayer(): ILayerPostRequest {
    this.logger.log('info', 'get layer request');
    return mockLayer;
  }

  public addLayer(layerRequest: ILayerPostRequest): void {
    this.logger.log('info', `add layer request: ${layerRequest.name}`);
    const jsonDocument: IMapProxyJsonDocument = convertYamlToJson();

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
    replaceYamlFileContent(yamlContent);
  }
}
