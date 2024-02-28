import { extname, sep, join } from 'node:path';
import { promises as fsp } from 'node:fs';
import { safeLoad, safeDump, YAMLException } from 'js-yaml';
import { container } from 'tsyringe';
import { SERVICES } from '../common/constants';
import { IFSConfig, IMapProxyJsonDocument, IMosaicLayerObject } from './interfaces';
import { SourceTypes } from './enums';

// read mapproxy yaml config file and convert it into a json object
export function convertYamlToJson(yamlContent: string): IMapProxyJsonDocument {
  try {
    const jsonDocument: IMapProxyJsonDocument = safeLoad(yamlContent) as IMapProxyJsonDocument;
    return jsonDocument;
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (error instanceof YAMLException) {
      throw new YAMLException('Invalid YAML syntax error');
    }
    throw error;
  }
}

// read json object and convert it into a yaml content
export function convertJsonToYaml(jsonDocument: IMapProxyJsonDocument): string {
  const yamlContent: string = safeDump(jsonDocument, { noArrayIndent: true });
  return yamlContent;
}

// write new content in mapproxy yaml config file
export async function replaceYamlFileContent(yamlFilePath: string, yamlContent: string): Promise<void> {
  await fsp.writeFile(yamlFilePath, yamlContent, 'utf8');
}

// sort an array in numerical order
export function sortArrayByZIndex(layersArr: IMosaicLayerObject[]): string[] {
  const sortedArray = layersArr.sort((a, b) => a.zIndex - b.zIndex);
  return sortedArray.map((val) => val.layerName);
}

// get the extension from a file path
export function getFileExtension(path: string): string {
  return extname(path);
}

export function getRedisCacheName(cacheName: string): string {
  return `${cacheName}-redis`;
}

// reduce from cache name to layerName
export function getRedisCacheOriginalName(cacheName: string): string {
  return cacheName.replace('-redis', '');
}

export function isRedisCacheLayer(layerName: string): boolean {
  return layerName.endsWith('-redis');
}

export function adjustTilesPath(tilesPath: string, cacheSource: string): string {
  const fsConfig = container.resolve<IFSConfig>(SERVICES.FS);
  switch (cacheSource) {
    case SourceTypes.FS:
      tilesPath = join(fsConfig.internalMountDir, fsConfig.subTilesPath, tilesPath);
      tilesPath = tilesPath.endsWith(sep) ? tilesPath : tilesPath + sep;
      break;
    case SourceTypes.S3:
      tilesPath = tilesPath.startsWith('/') ? tilesPath : `/${tilesPath}`;
      tilesPath = tilesPath.endsWith('/') ? tilesPath : `${tilesPath}/`;
      break;
    default:
      throw new Error(`Invalid cache source: ${cacheSource} has been provided`);
  }
  return tilesPath;
}
