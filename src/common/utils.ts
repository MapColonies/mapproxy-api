import { readFileSync, writeFileSync } from 'fs';
import { safeLoad, safeDump } from 'js-yaml';
import { IMapProxyJsonDocument } from './interfaces';

// read mapproxy yaml config file and convert it into a json object
export function convertYamlToJson(yamlFilePath: string): IMapProxyJsonDocument | undefined {
  try {
    const yamlContent: string = readFileSync(yamlFilePath, 'utf8');
    const jsonDocument: IMapProxyJsonDocument = safeLoad(yamlContent) as IMapProxyJsonDocument;
    return jsonDocument;
  } catch (error) {
    throw new Error(error);
  }
}

// read json object and convert it into a yaml content
export function convertJsonToYaml(jsonDocument: IMapProxyJsonDocument): string | undefined {
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
