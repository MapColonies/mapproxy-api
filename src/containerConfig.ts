import { readFileSync } from 'fs';
import { container } from 'tsyringe';
import config from 'config';
import { Probe } from '@map-colonies/mc-probe';
import { MCLogger, ILoggerConfig, IServiceConfig } from '@map-colonies/mc-logger';
import { Services } from './common/constants';
import { IFileProvider, IMapProxyConfig } from './common/interfaces';
import { Providers } from './common/enums/providers';
import { S3Provider } from './common/providers/s3Provider';
import { FSProvider } from './common/providers/fSProvider';

function registerExternalValues(): void {
  const loggerConfig = config.get<ILoggerConfig>('logger');
  const mapproxyConfig = config.get<IMapProxyConfig>('mapproxy');
  const packageContent = readFileSync('./package.json', 'utf8');
  const service = JSON.parse(packageContent) as IServiceConfig;
  const logger = new MCLogger(loggerConfig, service);
  container.register(Services.CONFIG, { useValue: config });
  container.register(Services.LOGGER, { useValue: logger });
  container.register(Services.MAPPROXY, { useValue: mapproxyConfig });
  container.register(Services.FILEPROVIDER, {
    useFactory: (): IFileProvider => {
      return mapproxyConfig.fileProvider === Providers.S3 ? new S3Provider(container) : new FSProvider(container);
    },
  });
  container.register<Probe>(Probe, { useFactory: (container) => new Probe(container.resolve(Services.LOGGER), {}) });
}

export { registerExternalValues };
