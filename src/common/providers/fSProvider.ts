import { promises as fsp } from 'fs';
import { Logger } from '@map-colonies/js-logger';
import { container } from 'tsyringe';
import { SERVICES } from '../constants';
import { IConfigProvider, IFSConfig, IMapProxyJsonDocument } from '../interfaces';
import { convertJsonToYaml, convertYamlToJson, replaceYamlFileContent } from '../utils';

export class FSProvider implements IConfigProvider {
  private readonly logger: Logger;
  private readonly fsConfig: IFSConfig;

  public constructor() {
    this.logger = container.resolve(SERVICES.LOGGER);
    this.fsConfig = container.resolve(SERVICES.FS);
  }

  public async updateJson(jsonContent: IMapProxyJsonDocument): Promise<void> {
    try {
      const yamlContent = convertJsonToYaml(jsonContent);
      await replaceYamlFileContent(this.fsConfig.yamlFilePath, yamlContent);
    } catch (error) {
      this.logger.error(`Failed to update file: ${(error as Error).message}`);
      throw error;
    }
  }

  public async getJson(): Promise<IMapProxyJsonDocument> {
    try {
      const yamlContent = await fsp.readFile(this.fsConfig.yamlFilePath, { encoding: 'utf8' });
      const jsonContent = convertYamlToJson(yamlContent) as unknown as IMapProxyJsonDocument;
      return jsonContent;
    } catch (error) {
      this.logger.error(`Failed to provied json from file: ${(error as Error).message}`);
      throw error;
    }
  }
}
