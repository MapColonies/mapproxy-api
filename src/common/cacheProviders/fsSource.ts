/* eslint-disable @typescript-eslint/naming-convention */
import { DependencyContainer } from 'tsyringe';
import { SERVICES } from '../constants';
import { SourceTypes } from '../enums/sourceTypes';
import { ICacheProvider, IFSSource, IMapProxyConfig } from '../interfaces';
import { adjustTilesPath } from '../utils';

class FSSource implements ICacheProvider {
  private readonly mapproxyConfig: IMapProxyConfig;

  public constructor(container: DependencyContainer) {
    this.mapproxyConfig = container.resolve(SERVICES.MAPPROXY);
  }
  public getCacheSource(sourcePath: string): IFSSource {
    const sourceCacheType = SourceTypes.FS;
    const fsSource: IFSSource = {
      type: sourceCacheType,
      directory: adjustTilesPath(sourcePath, sourceCacheType),
      directory_layout: this.mapproxyConfig.cache.directoryLayout,
    };

    return fsSource;
  }
}

export { FSSource };
