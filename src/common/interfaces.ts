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

export interface MapProxyJsonDocument {
  services: JsonObject;
  layers: MapProxyLayer[];
  caches: JsonObject;
  grids: JsonObject;
  globals: JsonObject;
}

export interface MapProxyCacheSource {
  type: string;
  directory: string;
  directory_layout: string;
}

export interface MapProxyCache {
  sources: string[];
  grids: string[];
  request_format: string;
  upscale_tiles: number;
  cache: MapProxyCacheSource;
}

export interface MapProxyLayer {
  name: string;
  title?: string;
  sources: string[];
}

export interface LayerPostRequest {
  id?: number;
  name: string;
  tilesPath: string;
  maxZoomLevel?: number;
  description: string;
}
