import { existsSync, writeFileSync } from 'fs';
import { extname } from 'path';
import { container } from 'tsyringe';
import { ServiceUnavailableError } from './common/exceptions/http/serviceUnavailableError';
import { ILogger, IMapProxyConfig, IMapProxyJsonDocument } from './common/interfaces';
import { convertJsonToYaml, convertYamlToJson } from './common/utils';
import { Services } from './common/constants';

// create default config yaml file if not exists
export function initConfig(mapproxyConfig: IMapProxyConfig): void {
  const logger: ILogger = container.resolve(Services.LOGGER);
  try {
    const extension: string = extname(mapproxyConfig.yamlFilePath);
    if (extension !== mapproxyConfig.fileExt) {
      throw new ServiceUnavailableError(
        `Invalid file path or Unsupported extension, expected to receive file path with: '${mapproxyConfig.fileExt as string}' extension`
      );
    }
    if (existsSync(mapproxyConfig.yamlFilePath) && extension === mapproxyConfig.fileExt) {
      logger.log('info', 'Using existing configuration file');
      return;
    }

    logger.log('info', 'Configuration file not found, creating default configuration file');
    const jsonDocument: IMapProxyJsonDocument = convertYamlToJson(mapproxyConfig.defaultFilePath as string);
    jsonDocument.globals.cache.s3.endpoint_url = mapproxyConfig.s3.endpointUrl;
    jsonDocument.globals.cache.s3.bucket_name = mapproxyConfig.s3.storageBucket;
    const yamlContent = convertJsonToYaml(jsonDocument);
    writeFileSync(mapproxyConfig.yamlFilePath, yamlContent, 'utf8');

    logger.log('info', 'Successfully created default configuration file');
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    logger.log('error', `Error occurred: ${error}`);
    throw new Error(error);
  }
}
