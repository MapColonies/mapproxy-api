/* eslint-disable @typescript-eslint/naming-convention */
import { parse } from 'path';
import { DependencyContainer } from 'tsyringe';
import { SourceTypes } from './enums/sourceTypes';
import { Services } from './constants';
import { ICacheProvider, IGpkgSource, ILogger, IMapProxyConfig } from './interfaces';

class GpkgSource implements ICacheProvider {
  private readonly mapproxyConfig: IMapProxyConfig;
  private readonly logger: ILogger;

  public constructor(container: DependencyContainer) {
    this.logger = container.resolve(Services.LOGGER);
    this.mapproxyConfig = container.resolve(Services.MAPPROXY);
  }

  public getCacheSource(sourcePath: string): IGpkgSource {
    const fileBasename = parse(sourcePath).name;

    const gpkgSource: IGpkgSource = {
      type: SourceTypes.GPKG,
      filename: sourcePath,
      table_name: fileBasename,
    };

    return gpkgSource;
  }
}

export { GpkgSource };
