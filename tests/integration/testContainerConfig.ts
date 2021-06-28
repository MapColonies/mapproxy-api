import { container } from 'tsyringe';
import config from 'config';
import { Services } from '../../src/common/constants';
import { IFileProvider, IMapProxyConfig } from '../../src/common/interfaces';
import { MockFileProvider } from '../unit/mock/mockFileProvider';
import { PGClient } from '../../src/pg/pgClient';

function registerTestValues(): void {
  const mapproxyConfig = config.get<IMapProxyConfig>('mapproxy');

  container.register(Services.CONFIG, { useValue: config });
  container.register(Services.LOGGER, { useValue: { log: jest.fn() } });
  container.register(Services.MAPPROXY, { useValue: mapproxyConfig });
  container.register(Services.FILEPROVIDER, {
    useFactory: (): IFileProvider => {
      return new MockFileProvider();
    },
  });
  container.register(Services.PG, { useClass: PGClient });
}
export { registerTestValues };
