/* eslint-disable @typescript-eslint/naming-convention */
import { PoolClient } from 'pg';
import { JsonObject } from 'swagger-ui-express';
import { TileOutputFormat } from '@map-colonies/mc-model-types';
import { TilesMimeFormat } from '@map-colonies/types';
import { Providers } from './enums';

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

export interface IDBConfig {
  host: string;
  user: string;
  database: string;
  schema: string;
  password: string;
  port: number;
  table: string;
  columns: IDBColumns;
  sslEnabled: boolean;
  rejectUnauthorized: boolean;
  sslPaths: {
    ca: string;
    key: string;
    cert: string;
  };
}

export interface IDBColumns {
  data: string;
  updatedTime: string;
}

export interface IMapProxyConfig {
  configProvider: Providers;
  cache: {
    grids: string;
    format: TilesMimeFormat;
    upscaleTiles: number;
    directoryLayout: string;
    gpkgExt: string;
  };
}

export interface IFSConfig {
  yamlFilePath: string;
  internalMountDir: string;
  subTilesPath: string;
}

export interface IS3Config {
  accessKeyId: string;
  secretAccessKey: string;
  endpointUrl: string;
  bucket: string;
  objectKey: string;
  sslEnabled: boolean;
}

export interface IRedisConfig {
  enabled: boolean;
  host: string;
  port: number;
  auth: {
    enableRedisUser: boolean;
    username: string;
    password: string;
  };
  prefix: {
    enablePrefix: boolean;
    prefix: string;
  };
  type: string;
  default_ttl: number;
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

export interface IS3Source extends ICacheSource {
  directory: string;
  directory_layout: string;
}

export interface IRedisSource extends ICacheSource {
  host: string;
  port: number;
  username?: string;
  password?: string;
  type: string;
  prefix?: string;
  default_ttl: number;
}

export interface ICacheName {
  cacheName: string;
}

export interface ICacheObject {
  cacheName: string;
  cache: IRedisSource | IS3Source | IFSSource;
}

export interface IGpkgSource extends ICacheSource {
  filename: string;
  table_name: string;
}

export interface IFSSource extends IS3Source {}

export interface IMapProxyCache {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  sources: string[];
  grids: string[];
  format: string;
  upscale_tiles?: number;
  cache: ICacheSource;
  minimize_meta_requests?: boolean;
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
  cacheType: string;
  format: TileOutputFormat;
}

export interface IConfigProvider {
  updateJson: (editJson: (content: IMapProxyJsonDocument) => IMapProxyJsonDocument) => Promise<void>;
  getJson: () => Promise<IMapProxyJsonDocument>;
}

export interface ICacheProvider {
  getCacheSource: (sourcePath: string, tableName?: string) => IS3Source | IGpkgSource | IRedisSource;
}

export interface IPGClient {
  getPoolConnection: () => Promise<PoolClient>;
}

// TODO: use MIME Types
export enum SchemaType {
  JSON = 'application/json',
  YAML = 'application/yaml',
}
