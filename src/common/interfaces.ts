/* eslint-disable @typescript-eslint/naming-convention */
import { ILogMethod } from '@map-colonies/mc-logger';
import { JsonObject } from 'swagger-ui-express';

export interface ILogger {
  log: ILogMethod;
}

export interface IConfig {
  get: <T>(setting: string) => T;
  has: (setting: string) => boolean;
}

export interface OpenApiConfig {
  filePath: string;
  basePath: string;
  jsonPath: string;
  uiPath: string;
}

export interface IMapProxyConfig {
  yamlFilePath: string;
  cache: {
    grids: string[];
    request_format: string;
    upscale_tiles: number;
    type: string;
    directory_layout: string;
  };
}

export interface IMapProxyJsonDocument {
  services: JsonObject;
  layers: IMapProxyLayer[];
  caches: IMapProxyCache;
  grids: JsonObject;
  globals: JsonObject;
}

export interface IMapProxyCacheSource {
  type: string;
  directory: string;
  directory_layout: string;
}

export interface IMapProxyCache {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  sources: string[];
  grids: string[];
  request_format?: string;
  upscale_tiles?: number;
  cache?: IMapProxyCacheSource;
}

export interface IMapProxyLayer {
  name: string;
  title?: string;
  sources: string[];
}

export interface ILayerPostRequest {
  id?: number;
  name: string;
  tilesPath: string;
  maxZoomLevel?: number;
  description: string;
}

export interface ILayerToBestRequest {
  layerName: string;
  bestName: string;
}

export interface IBestLayer {
  layers: string[];
}
