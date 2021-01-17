import { readFileSync, writeFileSync } from 'fs';
import { safeLoad, safeDump } from 'js-yaml';
import config from 'config';
import { IMapProxyConfig, IMapProxyJsonDocument } from './interfaces';

const mapproxyConfig = config.get<IMapProxyConfig>('mapproxy');

// read mapproxy yaml config file and convert it into a json object
export function convertYamlToJson(): IMapProxyJsonDocument {
  try {
    const yamlContent: string = readFileSync(mapproxyConfig.yamlFilePath, 'utf8');
    const jsonDocument: IMapProxyJsonDocument = safeLoad(yamlContent) as IMapProxyJsonDocument;
    return jsonDocument;
  } catch (error) {
    throw new Error(error);
  }
}

// read json object and convert it into a yaml content
export function convertJsonToYaml(jsonDocument: IMapProxyJsonDocument): string {
  try {
    const yamlContent: string = safeDump(jsonDocument, { noArrayIndent: true });
    return yamlContent;
    //TODO: add yaml content validation
  } catch (error) {
    throw new Error(error);
  }
}

// write new content in mapproxy yaml config file
export function replaceYamlFileContent(yamlContent: string): void {
  try {
    writeFileSync(mapproxyConfig.yamlFilePath, yamlContent, 'utf8');
  } catch (error) {
    throw new Error(error);
  }
}

// check if requested layer name is already exists in mapproxy config file (layer name must be unique)
export function isLayerNameExists(jsonDocument:IMapProxyJsonDocument, layerName: string): boolean {
  try {
    const publishedLayers: string[] = Object.keys(jsonDocument.caches);
    return publishedLayers.includes(layerName);
  } catch (error) {
    throw new Error(error);
  }
}
