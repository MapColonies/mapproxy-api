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
  fileExt?: string;
  defaultFilePath?: string;
  cache: {
    grids: string[];
    requestFormat: string;
    upscaleTiles: number;
    type: string;
    directoryLayout: string;
  };
  s3: {
    awsAccessKeyId: string;
    awsSecretAccessKey: string;
    endpointUrl: string;
    storageBucket: string;
    configFileBucket: string;
    objectKey: string;
    sslEnabled: boolean;
  };
}

export interface IMapProxyJsonDocument {
  services: JsonObject;
  layers: IMapProxyLayer[];
  caches: IMapProxyCache;
  grids: JsonObject;
  globals: IMapProxyGlobalConfig;
}

export interface IMapProxyGlobalConfig {
  cache: {
    s3: {
      endpoint_url: string;
      bucket_name: string;
    };
  };
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
  request_format: string;
  upscale_tiles: number;
  cache: IMapProxyCacheSource;
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

export interface ILayerToMosaicRequest {
  layerName: string;
}

export interface IMosaicLayer {
  layers: string[];
}

export interface IMosaicLayerObject {
  layerName: string;
  zIndex: number;
}

export interface IUpdateMosaicRequest {
  layers: IMosaicLayerObject[];
}
