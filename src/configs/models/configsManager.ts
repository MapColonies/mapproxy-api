/* eslint-disable @typescript-eslint/naming-convention */
import { inject, injectable } from 'tsyringe';
import { Logger } from '@map-colonies/js-logger';
import { SERVICES } from '../../common/constants';
import { IMapProxyJsonDocument, IMapProxyConfig, IConfigProvider } from '../../common/interfaces';

@injectable()
class ConfigsManager {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.MAPPROXY) private readonly mapproxyConfig: IMapProxyConfig,
    @inject(SERVICES.CONFIGPROVIDER) private readonly configProvider: IConfigProvider
  ) {}

  public async getConfig(): Promise<IMapProxyJsonDocument> {
    const jsonDocument: IMapProxyJsonDocument = await this.configProvider.getJson();
    return jsonDocument;
  }
}

export { ConfigsManager };
