/* eslint-disable @typescript-eslint/naming-convention */
import { inject, injectable } from 'tsyringe';
import { Services } from '../../common/constants';
import { ILogger, IMapProxyCache, IMapProxyJsonDocument, IMapProxyConfig, ILayerToBestRequest, IBestLayer } from '../../common/interfaces';
import { convertJsonToYaml, convertYamlToJson, replaceYamlFileContent } from '../../common/utils';
import { ConfilctError } from '../../common/exceptions/http/confilctError';
import { identity } from 'lodash';
import { json } from 'express';

@injectable()
export class BestsManager {
  public constructor(
    @inject(Services.LOGGER) private readonly logger: ILogger,
    @inject(Services.MAPPROXY) private readonly mapproxyConfig: IMapProxyConfig
  ) {}

  public getBest(): IBestLayer {
    this.logger.log('info', 'Get layer request');
    const bestLayers: IBestLayer = {layers: ['mock', 'mock2', 'mock3']};
    return bestLayers;
  }

  public addLayerToBest(layerToBestRequest: ILayerToBestRequest): void {
    this.logger.log('info', `Add layer: ${layerToBestRequest.layerName} to best: ${layerToBestRequest.bestName} request`);
    const jsonDocument: IMapProxyJsonDocument = convertYamlToJson(this.mapproxyConfig.yamlFilePath);

    if (!this.isLayerNameExists(jsonDocument, layerToBestRequest.layerName)){
      throw new ConfilctError(`Layer name '${layerToBestRequest.layerName}' is not exists`);
    }

    if (!this.isLayerNameExists(jsonDocument, layerToBestRequest.bestName)){
        throw new ConfilctError(`Best name '${layerToBestRequest.bestName}' is not exists`);
    }

    jsonDocument.caches[layerToBestRequest.bestName]?.sources?.push(layerToBestRequest.layerName);
    console.log(jsonDocument.caches[layerToBestRequest.bestName].sources);

    const yamlContent = convertJsonToYaml(jsonDocument);
    replaceYamlFileContent(this.mapproxyConfig.yamlFilePath, yamlContent);
    this.logger.log('info', `Successfully added layer: '${layerToBestRequest.layerName}' to best: '${layerToBestRequest.bestName}'`);
  }

  // check if requested layer name is already exists in mapproxy config file (layer name must be unique)
  public isLayerNameExists(jsonDocument: IMapProxyJsonDocument, layerName: string): boolean {
    try {
      const publishedLayers: string[] = Object.keys(jsonDocument.caches);
      return publishedLayers.includes(layerName);
    } catch (error) {
      throw new Error(error);
    }
  }
}
