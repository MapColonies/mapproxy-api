import { extname } from 'path';
import { promises as fsp } from 'fs';
import { safeLoad, safeDump, YAMLException } from 'js-yaml';
import { ServiceUnavailableError } from './exceptions/http/serviceUnavailableError';
import { IMapProxyJsonDocument, IMosaicLayerObject } from './interfaces';

// read mapproxy yaml config file and convert it into a json object
export function convertYamlToJson(yamlContent: string): IMapProxyJsonDocument {
  try {
    const jsonDocument: IMapProxyJsonDocument = safeLoad(yamlContent) as IMapProxyJsonDocument;
    return jsonDocument;
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (error.code === 'ENOENT') {
      throw new ServiceUnavailableError('Yaml file is not found');
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (error instanceof YAMLException) {
      throw new YAMLException('Invalid YAML syntax error');
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
export async function replaceYamlFileContent(yamlFilePath: string, yamlContent: string): Promise<void> {
  try {
    await fsp.writeFile(yamlFilePath, yamlContent, 'utf8');
  } catch (error) {
    throw new Error(error);
  }
}

// sort an array in numerical order
export function sortArrayByZIndex(layersArr: IMosaicLayerObject[]): string[] {
  try {
    const sortedArray = layersArr.sort((a, b) => a.zIndex - b.zIndex);
    return sortedArray.map((val) => val.layerName);
  } catch (error) {
    throw new Error(error);
  }
}

// get the extension from a file path
export function getFileExtension(path: string): string {
  try {
    return extname(path);
  } catch (error) {
    throw new Error(error);
  }
}
