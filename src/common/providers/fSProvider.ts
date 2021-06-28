import { promises as fsp } from 'fs';
import { container } from 'tsyringe';
import { Services } from '../constants';
import { IFileProvider, ILogger, IMapProxyConfig, IMapProxyJsonDocument } from '../interfaces';
import { convertJsonToYaml, convertYamlToJson, replaceYamlFileContent } from '../utils';

export class FSProvider implements IFileProvider {
  private readonly logger: ILogger;
  private readonly mapproxyConfig: IMapProxyConfig;

  public constructor() {
    this.logger = container.resolve(Services.LOGGER);
    this.mapproxyConfig = container.resolve(Services.MAPPROXY);
  }

  public async updateJson(jsonContent: IMapProxyJsonDocument): Promise<void> {
    try {
      const yamlContent = convertJsonToYaml(jsonContent);
      await replaceYamlFileContent(this.mapproxyConfig.yamlFilePath, yamlContent);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      this.logger.log('error', `Failed to update file: ${error}`);
      throw new Error(error);
    }
  }

  public async getJson(): Promise<IMapProxyJsonDocument> {
    try {
      const yamlContent = await fsp.readFile(this.mapproxyConfig.yamlFilePath, { encoding: 'utf8' });
      const jsonContent = (convertYamlToJson(yamlContent) as unknown) as IMapProxyJsonDocument;
      return jsonContent;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      this.logger.log('error', `Failed to provied json from file: ${error}`);
      throw new Error(error);
    }
  }
}
