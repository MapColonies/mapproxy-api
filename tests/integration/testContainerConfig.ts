import { container } from 'tsyringe';
import config from 'config';
import { SERVICES } from '../../src/common/constants';
import { IConfigProvider, IFSConfig, IMapProxyConfig, IRedisConfig } from '../../src/common/interfaces';
import { MockConfigProvider, init } from '../unit/mock/mockConfigProvider';


function registerTestValues(): void {
  const mapproxyConfig = config.get<IMapProxyConfig>('mapproxy');
  const redisConfig = config.get<IRedisConfig>('redis');
  const fsConfig = config.get<IFSConfig>('FS');
  init();

  container.register(SERVICES.CONFIG, { useValue: config });
  container.register(SERVICES.LOGGER, { useValue: { log: jest.fn() } });
  container.register(SERVICES.MAPPROXY, { useValue: mapproxyConfig });
  container.register(SERVICES.REDISCONFIG, { useValue: redisConfig });
  container.register(SERVICES.FS, { useValue: fsConfig });
  container.register(SERVICES.CONFIGPROVIDER, {
    useFactory: (): IConfigProvider => {
      return MockConfigProvider;
    },
  });
  container.register(SERVICES.PG, { useValue: {} });
}
export { registerTestValues };
