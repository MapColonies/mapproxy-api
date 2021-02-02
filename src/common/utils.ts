import { readFileSync, writeFileSync } from 'fs';
import { safeLoad, safeDump } from 'js-yaml';
import { ServiceUnavailableError } from './exceptions/http/serviceUnavailableError';
import { IMapProxyJsonDocument, IReorderMosaicLayerObject } from './interfaces';

// read mapproxy yaml config file and convert it into a json object
export function convertYamlToJson(yamlFilePath: string): IMapProxyJsonDocument {
  try {
    const yamlContent: string = readFileSync(yamlFilePath, 'utf8');
    const jsonDocument: IMapProxyJsonDocument = safeLoad(yamlContent) as IMapProxyJsonDocument;
    return jsonDocument;
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (error.code === 'ENOENT') {
      throw new ServiceUnavailableError('Yaml file is not found');
    }
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
export function replaceYamlFileContent(yamlFilePath: string, yamlContent: string): void {
  try {
    writeFileSync(yamlFilePath, yamlContent, 'utf8');
  } catch (error) {
    throw new Error(error);
  }
}

// sort an array in numerical order
export function sortArrayByZIndex(layersArr: IReorderMosaicLayerObject[]): string[] {
  try {
    const sortedArray = layersArr.sort((a, b) => a.zIndex - b.zIndex);
    return sortedArray.map((val) => val.layerName);
  } catch (error) {
    throw new Error(error);
  }
}
