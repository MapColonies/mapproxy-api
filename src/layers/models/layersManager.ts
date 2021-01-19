/* eslint-disable @typescript-eslint/naming-convention */
import { inject, injectable } from 'tsyringe';
import { Services } from '../../common/constants';
import { ILogger, ILayerPostRequest, IMapProxyCache, IMapProxyJsonDocument, IMapProxyLayer, IMapProxyConfig } from '../../common/interfaces';
import { mockLayer } from '../../../src/common/data/mock/mockLayer';
import { convertJsonToYaml, convertYamlToJson, replaceYamlFileContent } from '../../common/utils';
import { ConfilctError } from '../../common/exceptions/http/confilctError';
import { isLayerNameExists } from '../../common/validations/isLayerNameExists';

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
  }
