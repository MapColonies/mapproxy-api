import { container } from 'tsyringe';
import config from 'config';
import { Services } from '../../src/common/constants';
import { IConfigProvider, IFSConfig, IMapProxyConfig } from '../../src/common/interfaces';
import { MockConfigProvider } from '../unit/mock/mockConfigProvider';

function registerTestValues(): void {
  const mapproxyConfig = config.get<IMapProxyConfig>('mapproxy');
  const fsConfig = config.get<IFSConfig>('FS');

  container.register(Services.CONFIG, { useValue: config });
  container.register(Services.LOGGER, { useValue: { log: jest.fn() } });
  container.register(Services.MAPPROXY, { useValue: mapproxyConfig });
  container.register(Services.FS, { useValue: fsConfig });
  container.register(Services.CONFIGPROVIDER, {
    useFactory: (): IConfigProvider => {
      return new MockConfigProvider();
    },
  });
  container.register(Services.PG, { useValue: {} });
}
export { registerTestValues };
