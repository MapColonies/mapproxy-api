/* eslint-disable @typescript-eslint/naming-convention */
import config from 'config';
import { get, has } from 'lodash';
import { IConfig } from '../../src/common/interfaces';

let mockConfig: Record<string, unknown> = {};
const getMock = jest.fn();
const hasMock = jest.fn();

const configMock = {
  get: getMock,
  has: hasMock,
} as IConfig;

const init = (): void => {
  getMock.mockImplementation((key: string): unknown => {
    return mockConfig[key] ?? config.get(key);
  });
};

const setValue = (key: string | Record<string, unknown>, value?: unknown): void => {
  if (typeof key === 'string') {
    mockConfig[key] = value;
  } else {
    mockConfig = { ...mockConfig, ...key };
  }
};

const clear = (): void => {
  mockConfig = {};
};

const setConfigValues = (values: Record<string, unknown>): void => {
  getMock.mockImplementation((key: string) => {
    const value = get(values, key) ?? config.get(key);
    return value;
  });
  hasMock.mockImplementation((key: string) => has(values, key) || config.has(key));
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
  setConfigValues(config);
};

export { getMock, hasMock, configMock, setValue, clear, init, setConfigValues, registerDefaultConfig };
