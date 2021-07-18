/* eslint-disable @typescript-eslint/naming-convention */
import { DependencyContainer } from 'tsyringe';
import { Services } from '../constants';
import { SourceTypes } from '../enums/sourceTypes';
import { ICacheProvider, IFSSource, IMapProxyConfig } from '../interfaces';
import { getTilesPath } from '../utils';

class FSSource implements ICacheProvider {
  private readonly mapproxyConfig: IMapProxyConfig;

  public constructor(container: DependencyContainer) {
    this.mapproxyConfig = container.resolve(Services.MAPPROXY);
  }
  public getCacheSource(sourcePath: string): IFSSource {
    const fsSource: IFSSource = {
      type: SourceTypes.FS,
      directory: getTilesPath(sourcePath),
      directory_layout: this.mapproxyConfig.cache.directoryLayout,
    };

    return fsSource;
  }
}

export { FSSource };
