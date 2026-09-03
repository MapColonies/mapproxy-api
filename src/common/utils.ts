import { extname, sep, join } from 'node:path';
import { promises as fsp } from 'node:fs';
import { safeLoad, safeDump, YAMLException } from 'js-yaml';
import { container } from 'tsyringe';
import { SERVICES } from '../common/constants';
import { IFSConfig, IMapProxyJsonDocument } from './interfaces';
import { SourceTypes } from './enums';

// read mapproxy yaml config file and convert it into a json object
export function convertYamlToJson(yamlContent: string): IMapProxyJsonDocument {
  try {
    const jsonDocument: IMapProxyJsonDocument = safeLoad(yamlContent) as IMapProxyJsonDocument;
    return jsonDocument;
  } catch (error) {
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

// get the extension from a file path
export function getFileExtension(path: string): string {
  return extname(path);
}

/**
 * Normalize layerName to his related redis cacheName
 * @param layerName name related to mapproxy layerName
 * @return string - layerName include suffix of redis'.
 */
export function getRedisCacheName(layerName: string): string {
  return `${layerName}-redis`;
}

/**
 * Reduce the actual layer name from cache name
 * @param cacheName name related to redis cache layerName
 * @return string - layer name as served from mapproxy
 */ export function getRedisCacheOriginalName(cacheName: string): string {
  return cacheName.replace('-redis', '');
}

/**
 * Check if layerName contain redis suffix
 * @param layerName name related to mapproxy layerName
 * @return boolean - if the name include suffix '-redis'.
 */
export function isLayerNameSuffixRedis(layerName: string): boolean {
  return layerName.endsWith('-redis');
}

/**
 * Lift the Cache Type out of an untrusted configuration entry.
 *
 * This is the one place that reads a `caches` entry without trusting its type: production
 * configurations hold entries that are not well formed Caches. Nothing else about the entry is
 * inspected or asserted, so the codebase carries no notion of a malformed Cache.
 * @param cache an entry of the configuration's `caches` section, as read
 * @return string - the entry's Cache Type, or undefined if the entry does not state one
 */
export function readCacheType(cache: unknown): string | undefined {
  const cacheSource = (cache as { cache?: unknown } | null | undefined)?.cache;
  const cacheType = (cacheSource as { type?: unknown } | null | undefined)?.type;
  return typeof cacheType === 'string' ? cacheType : undefined;
}

export function adjustTilesPath(tilesPath: string, cacheSource: SourceTypes): string {
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
    case SourceTypes.GPKG:
    case SourceTypes.REDIS:
      throw new Error(`Invalid cache source: ${cacheSource} has been provided`);
  }
  return tilesPath;
}
