/* eslint-disable @typescript-eslint/naming-convention */
import { DependencyContainer } from 'tsyringe';
import { SourceTypes } from '../enums';
import { SERVICES } from '../constants';
import { ICacheProvider, IMapProxyConfig, IRedisSource } from '../interfaces';
import { adjustTilesPath } from '../utils';

class RedisSource implements ICacheProvider {
  private readonly mapproxyConfig: IMapProxyConfig;

  public constructor(container: DependencyContainer) {
    this.mapproxyConfig = container.resolve(SERVICES.MAPPROXY);
  }

  public getCacheSource(sourcePath: string): IRedisSource {
    const sourceCacheType = SourceTypes.REDIS;
    const redisSource: IRedisSource = {
      type: sourceCacheType,
      directory: adjustTilesPath(sourcePath, sourceCacheType),
      directory_layout: this.mapproxyConfig.cache.directoryLayout,
    };

    return redisSource;
  }
}

export { RedisSource };
