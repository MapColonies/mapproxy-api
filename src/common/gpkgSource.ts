/* eslint-disable @typescript-eslint/naming-convention */
import { SourceTypes } from './enums/sourceTypes';
import { DependencyContainer } from 'tsyringe';
import { Services } from './constants';
import { ICacheProvider, ICacheSource, IGpkgSource, ILogger, IMapProxyConfig, IS3Source } from './interfaces';

export class GpkgSource implements ICacheProvider {
  private readonly mapproxyConfig: IMapProxyConfig;
  private readonly logger: ILogger;

  public constructor(container: DependencyContainer) {
    this.logger = container.resolve(Services.LOGGER);
    this.mapproxyConfig = container.resolve(Services.MAPPROXY);
  }

  public getCacheSource(sourcePath: string): IGpkgSource {
    const gpkgSource: IGpkgSource = {
      type: SourceTypes.GPKG,
      filename: sourcePath,
      table_name: 'tablename'
    }

    return gpkgSource;
  }
};