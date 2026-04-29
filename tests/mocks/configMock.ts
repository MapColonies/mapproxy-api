import { get, set } from 'lodash';
import type { ConfigType } from '@src/common/config';

let mockConfig: Record<string, unknown> = {};
const getMock = jest.fn();
const hasMock = jest.fn();

const configMock = {
  get: getMock,
  has: hasMock,
} as unknown as ConfigType;

const init = (): void => {
  getMock.mockImplementation((key: string): unknown => {
    return (get as (object: Record<string, unknown>, path: string) => unknown)(mockConfig, key);
  });

  hasMock.mockImplementation((key: string): boolean => {
    return (get as (object: Record<string, unknown>, path: string) => unknown)(mockConfig, key) !== undefined;
  });
};

const setValue = (key: string, value: unknown): void => {
  set(mockConfig, key, value);
};

const clear = (): void => {
  mockConfig = {};
  getMock.mockReset();
  hasMock.mockReset();
  init();
};

const registerDefaultConfig = (): void => {
  const cfg = {
    openapiConfig: {
      filePath: './openapi3.yaml',
      basePath: '/docs',
      rawPath: '/api',
      uiPath: '/api',
    },
    telemetry: {
      logger: {
        level: 'info',
        prettyPrint: false,
        opentelemetryOptions: {
          enabled: false,
        },
      },
      shared: {},
      tracing: {
        isEnabled: false,
      },
    },
    server: {
      port: 8080,
      request: {
        payload: {
          limit: '1mb',
        },
      },
      response: {
        compression: {
          enabled: true,
          options: null,
        },
      },
    },
    mapproxy: {
      configProvider: 'fs',
      cache: {
        grids: 'epsg4326dir',
        upscaleTiles: 18,
        directoryLayout: 'tms',
        gpkgExt: '.gpkg',
        useHttpGet: true,
      },
    },
    FS: {
      yamlFilePath: '/tmp/mapproxy.yaml',
      internalMountDir: '',
      subTilesPath: '',
    },
    S3: {
      accessKeyId: 'minioadmin',
      secretAccessKey: 'minioadmin',
      endpointUrl: 'http://localhost:9000',
      bucket: 'bucket',
      objectKey: 'mapproxy.yaml',
      sslEnabled: false,
    },
    DB: {
      host: 'localhost',
      user: 'postgres',
      password: 'postgres',
      database: '',
      schema: 'public',
      port: 5432,
      table: 'config',
      columns: {
        data: 'data',
        updatedTime: 'updated_time',
      },
      sslEnabled: false,
      rejectUnauthorized: true,
      sslPaths: {
        ca: '',
        key: '',
        cert: '',
      },
    },
    redis: {
      enabled: true,
      host: 'raster-mapproxy-redis-master',
      port: 6379,
      auth: {
        enableRedisUser: true,
        username: 'mapcolonies',
        password: 'mapcolonies',
      },
      prefix: {
        enablePrefix: true,
        prefix: 'mcrl:',
      },
      type: 'redis',
      default_ttl: 86400,
    },
    redisDisabled: {
      enabled: false,
      host: 'raster-mapproxy-redis-master',
      port: 6379,
      auth: {
        enableRedisUser: true,
        username: 'mapcolonies',
        password: 'mapcolonies',
      },
      prefix: {
        enablePrefix: true,
        prefix: 'mcrl:',
      },
      type: 'redis',
      default_ttl: 86400,
    },
  };

  mockConfig = cfg as unknown as Record<string, unknown>;
  init();
};

export { configMock, getMock, hasMock, init, setValue, clear, registerDefaultConfig };

