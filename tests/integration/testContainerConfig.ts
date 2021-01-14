import { readFileSync } from 'fs';
import { container } from 'tsyringe';
import config from 'config';
import { MCLogger, IServiceConfig } from '@map-colonies/mc-logger';
import { Services } from '../../src/common/constants';
import { IMapProxyConfig } from '../../src/common/interfaces';

function registerTestValues(): void {
  const packageContent = readFileSync('./package.json', 'utf8');
  const service = JSON.parse(packageContent) as IServiceConfig;
  const logger = new MCLogger({ log2console: true, level: 'error' }, service);
  const mapproxyConfig = config.get<IMapProxyConfig>('mapproxy');

  container.register(Services.CONFIG, { useValue: config });
  container.register(Services.LOGGER, { useValue: logger });
  container.register(Services.MAPPROXY, { useValue: mapproxyConfig });
}

export { registerTestValues };
