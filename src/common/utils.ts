/* eslint-disable @typescript-eslint/ban-types */
import { readFileSync, writeFileSync } from 'fs';
import { safeLoad, safeDump } from 'js-yaml';
import config from 'config';
import { JsonObject } from 'swagger-ui-express';
import { MapProxyConfig } from './interfaces';

const mapproxyConfig = config.get<MapProxyConfig>('mapproxy');

// read mapproxy yaml config file and convert it into a json object
export function convertYamlToJson(): JsonObject {
  try {
    const yamlContent: string = readFileSync(mapproxyConfig.yamlFilePath, 'utf8');
    const jsonDocument: JsonObject = safeLoad(yamlContent) as JsonObject;
    return jsonDocument;
  } catch (error) {
    throw new Error('Throw error message');
  }
}

// read json object and convert it into a yaml content
export function convertJsonToYaml(jsonDocument: JsonObject): void {
  try {
    const yamlContent: string = safeDump(jsonDocument);
    //TODO: add yaml content validation
    console.log(yamlContent);
  } catch (error) {
    throw new Error('Throw error message');
  }
}

// write new content in mapproxy yaml config file
export function replaceYamlFileContent(yamlContent: string): void {
  try {
    writeFileSync(mapproxyConfig.yamlFilePath, yamlContent, 'utf8');
  } catch (e) {
    throw new Error('Throw error message');
  }
}

// check if requested layer name is already exists in mapproxy config file (layer name must be unique)
export function uniqueNameValidation(layerName: string): boolean {
  try {
    const document: JsonObject = convertYamlToJson();
    const publishedLayers: string[] = Object.keys(document.caches);
    return publishedLayers.includes(layerName);
  } catch (error) {
    throw new Error('Throw error message');
  }
}
