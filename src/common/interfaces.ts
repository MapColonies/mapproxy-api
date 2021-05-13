/* eslint-disable @typescript-eslint/naming-convention */
import { ILogMethod } from '@map-colonies/mc-logger';
import { JsonObject } from 'swagger-ui-express';
import { Providers } from './enums/providers';

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
  fileProvider: Providers;
  yamlFilePath: string;
  fileExt?: string;
  defaultFilePath?: string;
  cache: {
    grids: string[];
    requestFormat: string;
    upscaleTiles: number;
    type: string;
    directoryLayout: string;
    gpkgExt: string;
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

export interface ICacheSource {
  type: string;
}

export interface IS3Source extends ICacheSource{
  directory: string;
  directory_layout: string;
}

export interface IGpkgSource extends ICacheSource {
  filename: string;
  table_name: string;
}
export interface IMapProxyCache {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  sources: string[];
  grids: string[];
  request_format: string;
  upscale_tiles: number;
  cache: ICacheSource;
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

export interface IFileProvider {
  uploadFile: (filePath: string) => Promise<void>;
  getFile: (filePath: string) => Promise<void>;

}

export interface ICacheProvider {
  getCacheSource: (sourcePath: string, tableName?: string) => IS3Source | IGpkgSource;
}
