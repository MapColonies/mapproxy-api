/* eslint-disable @typescript-eslint/naming-convention */
import { DependencyContainer } from 'tsyringe';
import { SourceTypes } from '../enums';
import { SERVICES } from '../constants';
import { ICacheProvider, IMapProxyConfig, IRedisSource } from '../interfaces';
import config from 'config';

class RedisSource implements ICacheProvider {
  private readonly mapproxyConfig: IMapProxyConfig;

  public constructor(container: DependencyContainer) {
    this.mapproxyConfig = container.resolve(SERVICES.MAPPROXY);
  }

  public getCacheSource(): IRedisSource {
    const sourceCacheType = SourceTypes.REDIS;
    const redisHost = config.get<string>('redis.host');
    const redisPort = config.get<number>('redis.port');
    const redisDefaultTtl = config.get<number>('redis.default_ttl');

    const redisSource: IRedisSource = {
      host: redisHost,
      port: redisPort,
      type: sourceCacheType,
      default_ttl: redisDefaultTtl,
    };

    return redisSource;
  }
}

export { RedisSource };
