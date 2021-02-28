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
      throw new ServiceUnavailableError(`Unsupported extension: '${extension}' , must be '${mapproxyConfig.fileExt as string}'`);
    }
    if (existsSync(yamlFilePath) && extension === mapproxyConfig.fileExt) {
      console.log('using existing config file');
      return;
    }

    console.log('create config file');
    const jsonDocument: IMapProxyJsonDocument = convertYamlToJson(mapproxyConfig.defaultFilePath as string);
    jsonDocument.globals.cache.s3.endpoint_url = endPointUrl;
    jsonDocument.globals.cache.s3.bucket_name = bucket;
    const yamlContent = convertJsonToYaml(jsonDocument);
    writeFileSync(yamlFilePath, yamlContent, 'utf8');
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (error.code === 'ENOENT') {
      throw new ServiceUnavailableError(`Invalid file path: '${yamlFilePath}'`);
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (error.code === 'EISDIR') {
      throw new ServiceUnavailableError(`'${yamlFilePath}' is a directory, expected to receive file path`);
    }
    throw new Error(error);
  }
}
