import { getOtelMixin } from '@map-colonies/tracing-utils';
import { trace } from '@opentelemetry/api';
import { DependencyContainer } from 'tsyringe/dist/typings/types';
import { jsLogger } from '@map-colonies/js-logger';
import { Registry } from 'prom-client';
import { SERVICES, SERVICE_NAME } from './common/constants';
import { getTracing } from './common/tracing';
import { InjectionObject, registerDependencies } from './common/dependencyRegistration';
import { layersRouterFactory, LAYERS_ROUTER_SYMBOL } from './layers/routes/layersRouterFactory';
import { configsRouterFactory, CONFIGS_ROUTER_SYMBOL } from './configs/routes/configsRouterFactory';
import { IConfigProvider, IFSConfig, IMapProxyConfig, IRedisConfig, IS3Config } from './common/interfaces';
import { getProvider } from './getProvider';
import { getConfig } from './common/config';

export interface RegisterOptions {
  override?: InjectionObject<unknown>[];
  useChild?: boolean;
}

export const registerExternalValues = async (options?: RegisterOptions): Promise<DependencyContainer> => {
  const configInstance = getConfig();

  const loggerConfig = configInstance.get('telemetry.logger');
  const fsConfig = configInstance.get('FS') as IFSConfig;
  const s3Config = configInstance.get('S3') as IS3Config;
  const mapproxyConfig = configInstance.get('mapproxy') as IMapProxyConfig;
  const redisConfig = configInstance.get('redis') as IRedisConfig;

  // Keep logger configuration in sync with OTel tracing mixin.
  const logger = await jsLogger({ ...loggerConfig, prettyPrint: loggerConfig.prettyPrint, mixin: getOtelMixin() });

  const tracer = trace.getTracer(SERVICE_NAME);
  const metricsRegistry = new Registry();

  const dependencies: InjectionObject<unknown>[] = [
    { token: SERVICES.CONFIG, provider: { useValue: configInstance } },
    { token: SERVICES.LOGGER, provider: { useValue: logger } },
    { token: SERVICES.TRACER, provider: { useValue: tracer } },
    { token: SERVICES.METRICS, provider: { useValue: metricsRegistry } },
    { token: LAYERS_ROUTER_SYMBOL, provider: { useFactory: layersRouterFactory } },
    { token: CONFIGS_ROUTER_SYMBOL, provider: { useFactory: configsRouterFactory } },
    { token: SERVICES.MAPPROXY, provider: { useValue: mapproxyConfig } },
    { token: SERVICES.FS, provider: { useValue: fsConfig } },
    { token: SERVICES.S3, provider: { useValue: s3Config } },
    { token: SERVICES.REDISCONFIG, provider: { useValue: redisConfig } },
    {
      token: SERVICES.CONFIGPROVIDER,
      provider: {
        useFactory: (): IConfigProvider => {
          return getProvider(mapproxyConfig.configProvider);
        },
      },
    },
    {
      token: 'onSignal',
      provider: {
        useValue: {
          useValue: async (): Promise<void> => {
            await Promise.all([getTracing().stop()]);
          },
        },
      },
    },
  ];

  return registerDependencies(dependencies, options?.override, options?.useChild);
};
