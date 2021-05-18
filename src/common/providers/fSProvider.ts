import { DependencyContainer } from 'tsyringe';
import { Services } from '../constants';
import { IFileProvider, ILogger, IMapProxyConfig } from '../interfaces';

export class FSProvider implements IFileProvider {
  private readonly logger: ILogger;
  private readonly mapproxyConfig: IMapProxyConfig;

  public constructor(container: DependencyContainer) {
    this.logger = container.resolve(Services.LOGGER);
    this.mapproxyConfig = container.resolve(Services.MAPPROXY);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async uploadFile(filePath: string): Promise<void> {
    return Promise.resolve();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async getFile(filePath: string): Promise<void> {
    return Promise.resolve();
  }
}
