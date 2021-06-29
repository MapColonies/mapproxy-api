import { readFileSync } from 'fs';
import { container } from 'tsyringe';
import config from 'config';
import { Probe } from '@map-colonies/mc-probe';
import { MCLogger, ILoggerConfig, IServiceConfig } from '@map-colonies/mc-logger';
import { Services } from './common/constants';
import { IFileProvider, IMapProxyConfig, IS3Config } from './common/interfaces';
import { getProvider } from './getProvider';
import { PGClient } from './pg/pgClient';

function registerExternalValues(): void {
  const loggerConfig = config.get<ILoggerConfig>('logger');
  const mapproxyConfig = config.get<IMapProxyConfig>('mapproxy');
  const fsConfig = config.get<IS3Config>('FS');
  const s3Config = config.get<IS3Config>('S3');
  const packageContent = readFileSync('./package.json', 'utf8');
  const service = JSON.parse(packageContent) as IServiceConfig;
  const logger = new MCLogger(loggerConfig, service);
  container.register(Services.CONFIG, { useValue: config });
  container.register(Services.LOGGER, { useValue: logger });
  container.register(Services.MAPPROXY, { useValue: mapproxyConfig });
  container.register(Services.S3, { useValue: s3Config });
  container.register(Services.FS, { useValue: fsConfig });
  container.register(Services.FILEPROVIDER, {
    useFactory: (): IFileProvider => {
      return getProvider(mapproxyConfig.fileProvider);
    },
  });
  container.register(Services.PG, { useClass: PGClient });
  container.register<Probe>(Probe, { useFactory: (container) => new Probe(container.resolve(Services.LOGGER), {}) });
}

export { registerExternalValues };
