/* eslint-disable @typescript-eslint/naming-convention */
import { get, set } from 'lodash';
import type { ConfigType } from '@src/common/config';

let mockConfig: Record<string, unknown> = {};
const getMock = jest.fn();
const hasMock = jest.fn();

const configMock = {
  get: getMock,
} as unknown as ConfigType;

const init = (): void => {
  getMock.mockImplementation((key: string): unknown => {
    return (get as (object: Record<string, unknown>, path: string) => unknown)(mockConfig, key);
  });
};

const setValue = (key: string | Record<string, unknown>, value?: unknown): void => {
  if (typeof key === 'string') {
    set(mockConfig, key, value);
  } else {
    mockConfig = { ...mockConfig, ...key };
  }
};

const clear = (): void => {
  mockConfig = {};
};

const setConfigValues = (values: Record<string, unknown>): void => {
  getMock.mockImplementation((key: string) => {
    const value: unknown = (get as (object: Record<string, unknown>, path: string) => unknown)(values, key);
    return value;
  });
};

const registerDefaultConfig = (): void => {
  const config = {
    openapiConfig: {
      filePath: './openapi3.yaml',
      basePath: '/docs',
      jsonPath: '/api.json',
      uiPath: '/api',
    },
    logger: {
      level: 'info',
    },
    server: {
      port: 8080,
    },
    mapproxy: {
      configProvider: 'fs',
      cache: {
        grids: 'epsg4326dir',
        upscale_tiles: 18,
        type: 's3',
        directory_layout: 'tms',
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
  };
  mockConfig = config as unknown as Record<string, unknown>;
  setConfigValues(config);
};

export { getMock, hasMock, configMock, setValue, clear, init, setConfigValues, registerDefaultConfig };
