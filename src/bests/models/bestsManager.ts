/* eslint-disable @typescript-eslint/naming-convention */
import { inject, injectable } from 'tsyringe';
import { Services } from '../../common/constants';
import { ILogger, IMapProxyJsonDocument, IMapProxyConfig, ILayerToBestRequest, IBestLayer, IMapProxyCache } from '../../common/interfaces';
import { convertJsonToYaml, convertYamlToJson, replaceYamlFileContent } from '../../common/utils';
import { NoContentError } from '../../common/exceptions/http/noContentError';
import { isLayerNameExists } from '../../common/validations/isLayerNameExists';

@injectable()
export class BestsManager {
  public constructor(
    @inject(Services.LOGGER) private readonly logger: ILogger,
    @inject(Services.MAPPROXY) private readonly mapproxyConfig: IMapProxyConfig
  ) {}

  public getBest(): IBestLayer {
    this.logger.log('info', 'Get layer request');
    const bestLayers: IBestLayer = { layers: ['mock', 'mock2', 'mock3'] };
    return bestLayers;
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
