import config from 'config';
import { getOtelMixin } from '@map-colonies/telemetry';
import { trace } from '@opentelemetry/api';
import { DependencyContainer } from 'tsyringe/dist/typings/types';
import jsLogger, { LoggerOptions } from '@map-colonies/js-logger';
import { SERVICES, SERVICE_NAME } from './common/constants';
import { tracing } from './common/tracing';
import { InjectionObject, registerDependencies } from './common/dependencyRegistration';
import { layersRouterFactory, LAYERS_ROUTER_SYMBOL } from './layers/routes/layersRouterFactory';
import { configsRouterFactory, CONFIGS_ROUTER_SYMBOL } from './configs/routes/configsRouterFactory';
import { IConfigProvider, IFSConfig, IMapProxyConfig, IS3Config } from './common/interfaces';
import { getProvider } from './getProvider';

export interface RegisterOptions {
  override?: InjectionObject<unknown>[];
  useChild?: boolean;
}

export const registerExternalValues = (options?: RegisterOptions): DependencyContainer => {
  const loggerConfig = config.get<LoggerOptions>('telemetry.logger');
  const fsConfig = config.get<IFSConfig>('FS');
  const s3Config = config.get<IS3Config>('S3');
  const mapproxyConfig = config.get<IMapProxyConfig>('mapproxy');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const logger = jsLogger({ ...loggerConfig, prettyPrint: loggerConfig.prettyPrint, mixin: getOtelMixin() });

  tracing.start();
  const tracer = trace.getTracer(SERVICE_NAME);
  const dependencies: InjectionObject<unknown>[] = [
    { token: SERVICES.CONFIG, provider: { useValue: config } },
    { token: SERVICES.LOGGER, provider: { useValue: logger } },
    { token: SERVICES.TRACER, provider: { useValue: tracer } },
    { token: LAYERS_ROUTER_SYMBOL, provider: { useFactory: layersRouterFactory } },
    { token: CONFIGS_ROUTER_SYMBOL, provider: { useFactory: configsRouterFactory } },
    { token: SERVICES.MAPPROXY, provider: { useValue: mapproxyConfig } },
    { token: SERVICES.FS, provider: { useValue: fsConfig } },
    { token: SERVICES.S3, provider: { useValue: s3Config } },
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
            await Promise.all([tracing.stop()]);
          },
        },
      },
    },
  ];

  return registerDependencies(dependencies, options?.override, options?.useChild);
};
