import { existsSync, writeFileSync } from 'fs';
import { extname } from 'path';
import config from 'config';
import { ServiceUnavailableError } from './common/exceptions/http/serviceUnavailableError';
import { IMapProxyConfig, IMapProxyJsonDocument } from './common/interfaces';
import { convertJsonToYaml, convertYamlToJson } from './common/utils';

const mapproxyConfig = config.get<IMapProxyConfig>('mapproxy');
// create default config yaml file if not exists
export function initConfig(yamlFilePath: string, endPointUrl: string, bucket: string): void {
  try {
    const extension: string = extname(yamlFilePath);
    if (extension !== mapproxyConfig.fileExt) {
      throw new ServiceUnavailableError(
        `Invalid file path or Unsupported extension, expected to receive file path with: '${mapproxyConfig.fileExt as string}' extension`
      );
    }
    if (existsSync(yamlFilePath) && extension === mapproxyConfig.fileExt) {
      // TODO: add logger
      // logger.log('info', 'Using existing configuration file');
      return;
    }
    // TODO: add logger
    // logger.log('info', 'Configuration file not found, create default configuration file');
    const jsonDocument: IMapProxyJsonDocument = convertYamlToJson(mapproxyConfig.defaultFilePath as string);
    jsonDocument.globals.cache.s3.endpoint_url = endPointUrl;
    jsonDocument.globals.cache.s3.bucket_name = bucket;
    const yamlContent = convertJsonToYaml(jsonDocument);
    writeFileSync(yamlFilePath, yamlContent, 'utf8');
    // TODO: add logger
    // logger.log('info', 'Successfully created default configuration file')
  } catch (error) {
    // TODO: add logger
    // logger.log('error', `Error occurred: ${error}`);
    throw new Error(error);
  }
}
