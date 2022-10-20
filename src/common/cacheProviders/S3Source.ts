/* eslint-disable @typescript-eslint/naming-convention */
import { DependencyContainer } from 'tsyringe';
import { SourceTypes } from '../enums';
import { SERVICES } from '../constants';
import { ICacheProvider, IMapProxyConfig, IS3Source } from '../interfaces';
import { adjustTilesPath } from '../utils';

class S3Source implements ICacheProvider {
  private readonly mapproxyConfig: IMapProxyConfig;

  public constructor(container: DependencyContainer) {
    this.mapproxyConfig = container.resolve(SERVICES.MAPPROXY);
  }

  public getCacheSource(sourcePath: string): IS3Source {
    const sourceCacheType = SourceTypes.S3;
    const s3Source: IS3Source = {
      type: sourceCacheType,
      directory: adjustTilesPath(sourcePath, sourceCacheType),
      directory_layout: this.mapproxyConfig.cache.directoryLayout,
    };

    return s3Source;
  }
}

export { S3Source };
