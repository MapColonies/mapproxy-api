import { container } from 'tsyringe';
import config from 'config';
import { SERVICES } from '../../src/common/constants';
import { IConfigProvider, IFSConfig, IMapProxyConfig, IRedisConfig, IS3Config } from '../../src/common/interfaces';
import { MockConfigProvider, init } from '../unit/mock/mockConfigProvider';

function registerTestValues(): void {
  const mapproxyConfig = config.get<IMapProxyConfig>('mapproxy');
  const redisConfig = config.get<IRedisConfig>('redis');
  const fsConfig = config.get<IFSConfig>('FS');
  const s3Config = config.get<IS3Config>('S3');
  init();

  container.register(SERVICES.CONFIG, { useValue: config });
  container.register(SERVICES.LOGGER, { useValue: { log: jest.fn() } });
  container.register(SERVICES.MAPPROXY, { useValue: mapproxyConfig });
  container.register(SERVICES.REDISCONFIG, { useValue: redisConfig });
  container.register(SERVICES.FS, { useValue: fsConfig });
  container.register(SERVICES.S3, { useValue: s3Config });
  container.register(SERVICES.CONFIGPROVIDER, {
    useFactory: (): IConfigProvider => {
      return MockConfigProvider;
    },
  });
  container.register(SERVICES.PG, { useValue: {} });
}
export { registerTestValues };
