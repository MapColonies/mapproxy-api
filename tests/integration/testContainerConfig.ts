import { container } from 'tsyringe';
import config from 'config';
import { SERVICES } from '../../src/common/constants';
import { IConfigProvider, IFSConfig, IMapProxyConfig } from '../../src/common/interfaces';
import { MockConfigProvider } from '../unit/mock/mockConfigProvider';

function registerTestValues(): void {
  const mapproxyConfig = config.get<IMapProxyConfig>('mapproxy');
  const fsConfig = config.get<IFSConfig>('FS');
  const mockConfigProvider = new MockConfigProvider()

  container.register(SERVICES.CONFIG, { useValue: config });
  container.register(SERVICES.LOGGER, { useValue: { log: jest.fn() } });
  container.register(SERVICES.MAPPROXY, { useValue: mapproxyConfig });
  container.register(SERVICES.FS, { useValue: fsConfig });
  container.register(SERVICES.CONFIGPROVIDER, {
    useValue: mockConfigProvider
  });
  container.register(SERVICES.PG, { useValue: {} });
}
export { registerTestValues };
