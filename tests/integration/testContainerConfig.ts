import { container } from 'tsyringe';
import config from 'config';
import { Services } from '../../src/common/constants';
import { IFileProvider, IMapProxyConfig } from '../../src/common/interfaces';
import { Providers } from '../../src/common/enums/Providers';
import { S3Provider } from '../../src/common/providers/S3Provider';
import { FSProvider } from '../../src/common/providers/FSProvider';

function registerTestValues(): void {
  const mapproxyConfig = config.get<IMapProxyConfig>('mapproxy');

  container.register(Services.CONFIG, { useValue: config });
  container.register(Services.LOGGER, { useValue: { log: jest.fn() } });
  container.register(Services.MAPPROXY, { useValue: mapproxyConfig });
  container.register(Services.FILEPROVIDER, {
    useFactory: (): IFileProvider => {
      return mapproxyConfig.fileProvider === Providers.S3 ? new S3Provider(container) : new FSProvider();
    },
  });
}

export { registerTestValues };
