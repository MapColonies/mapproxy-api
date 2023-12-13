/* eslint-disable @typescript-eslint/naming-convention */
import { DependencyContainer } from 'tsyringe';
import config from 'config';
import { NotFoundError } from '@map-colonies/error-types';
import { SERVICES } from '../constants';
import { ICacheProvider, IMapProxyConfig, IRedisSource } from '../interfaces';
import { SourceTypes } from '../enums';

class RedisSource implements ICacheProvider {
  private readonly mapproxyConfig: IMapProxyConfig;

  public constructor(container: DependencyContainer) {
    this.mapproxyConfig = container.resolve(SERVICES.MAPPROXY);
  }

  public getCacheSource(): IRedisSource {
    try {
      const sourceCacheType = SourceTypes.REDIS;
      const redisHost = config.get<string>('redis.host');
      const redisPort = config.get<number>('redis.port');
      const redisDefaultTtl = config.get<number>('redis.default_ttl');
      const isRedisUser = config.get<boolean>('redis.enableRedisUser');
      const hasPrefix = config.get<boolean>('redis.enablePrefix');

      const baseRedisCache: IRedisSource = {
        host: redisHost,
        port: redisPort,
        type: sourceCacheType,
        default_ttl: redisDefaultTtl,
      };

      let redisSource: IRedisSource = baseRedisCache;

      if (isRedisUser) {
        const username = config.get<string>('redis.username');
        const password = config.get<string>('redis.password');

        redisSource = { ...baseRedisCache, username: username, password: password };
      }
      if (hasPrefix) {
        const prefix = config.get<string>('redis.prefix');

        redisSource = { ...baseRedisCache, prefix: prefix };
      }

      return redisSource;
    } catch {
      throw new NotFoundError('configuration is missing redis parameters');
    }
  }
}

export { RedisSource };
