/* eslint-disable @typescript-eslint/naming-convention */
import { DependencyContainer } from 'tsyringe';
import { SourceTypes } from '../enums/sourceTypes';
import { Services } from '../constants';
import { ICacheProvider, IMapProxyConfig, IS3Source } from '../interfaces';
import { getTilesPath } from '../utils';

class S3Source implements ICacheProvider {
  private readonly mapproxyConfig: IMapProxyConfig;

  public constructor(container: DependencyContainer) {
    this.mapproxyConfig = container.resolve(Services.MAPPROXY);
  }

  public getCacheSource(sourcePath: string): IS3Source {
    const s3Source: IS3Source = {
      type: SourceTypes.S3,
      directory: getTilesPath(sourcePath),
      directory_layout: this.mapproxyConfig.cache.directoryLayout,
    };

    return s3Source;
  }
}

export { S3Source };
