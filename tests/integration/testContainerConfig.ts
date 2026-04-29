import { jsLogger } from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import { Registry } from 'prom-client';
import { container } from 'tsyringe';
import type { ConfigType } from '@src/common/config';
import { SERVICES } from '../../src/common/constants';
import type { IConfigProvider, IFSConfig, IMapProxyConfig, IRedisConfig, IS3Config } from '../../src/common/interfaces';
import type { InjectionObject } from '../../src/common/dependencyRegistration';
import { configMock, getMock, hasMock, registerDefaultConfig } from '../mocks/configMock';
import { MockConfigProvider, init as initConfigProvider } from '../unit/mock/mockConfigProvider';

async function getTestContainerConfig(extra?: InjectionObject<unknown>[]): Promise<InjectionObject<unknown>[]> {
  registerDefaultConfig();
  initConfigProvider();

  const mapproxyConfig = configMock.get('mapproxy') as IMapProxyConfig;
  const redisConfig = configMock.get('redis') as IRedisConfig;
  const fsConfig = configMock.get('FS') as IFSConfig;
  const s3Config = configMock.get('S3') as IS3Config;

  return [
    { token: SERVICES.LOGGER, provider: { useValue: await jsLogger({ enabled: false }) } },
    { token: SERVICES.CONFIG, provider: { useValue: configMock as unknown as ConfigType } },
    { token: SERVICES.TRACER, provider: { useValue: trace.getTracer('testTracer') } },
    { token: SERVICES.METRICS, provider: { useValue: new Registry() } },
    { token: SERVICES.MAPPROXY, provider: { useValue: mapproxyConfig } },
    { token: SERVICES.REDISCONFIG, provider: { useValue: redisConfig } },
    { token: SERVICES.FS, provider: { useValue: fsConfig } },
    { token: SERVICES.S3, provider: { useValue: s3Config } },
    {
      token: SERVICES.CONFIGPROVIDER,
      provider: {
        useFactory: (): IConfigProvider => MockConfigProvider,
      },
    },
    ...(extra ?? []),
  ];
}

function registerTestValues(): void {
  registerDefaultConfig();
  initConfigProvider();

  const mapproxyConfig = configMock.get('mapproxy') as IMapProxyConfig;
  const redisConfig = configMock.get('redis') as IRedisConfig;
  const fsConfig = configMock.get('FS') as IFSConfig;
  const s3Config = configMock.get('S3') as IS3Config;

  container.register(SERVICES.CONFIG, { useValue: configMock });
  container.register(SERVICES.LOGGER, { useValue: { log: jest.fn() } });
  container.register(SERVICES.MAPPROXY, { useValue: mapproxyConfig });
  container.register(SERVICES.REDISCONFIG, { useValue: redisConfig });
  container.register(SERVICES.FS, { useValue: fsConfig });
  container.register(SERVICES.S3, { useValue: s3Config });
  container.register(SERVICES.CONFIGPROVIDER, {
    useFactory: (): IConfigProvider => MockConfigProvider,
  });
  container.register(SERVICES.PG, { useValue: {} });
}

const resetContainer = (clearInstances = true): void => {
  if (clearInstances) {
    container.clearInstances();
  }

  getMock.mockReset();
  hasMock.mockReset();
};

export { getTestContainerConfig, registerTestValues, resetContainer };
