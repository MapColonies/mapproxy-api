/* eslint-disable @typescript-eslint/naming-convention */
import { DependencyContainer } from 'tsyringe';
import { SourceTypes } from '../enums';
import { SERVICES } from '../constants';
import { ICacheProvider, IMapProxyConfig, IRedisSource } from '../interfaces';
import config from 'config';
import { bool } from 'aws-sdk/clients/signer';
import { NotFoundError } from '@map-colonies/error-types';

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
    const isRedisUser = config.get<boolean>('redis.enableRedisUser');

    if (isRedisUser) {
      const username = config.get<string>('redis.username');
      const password = config.get<string>('redis.password');

      const redisSource: IRedisSource = {
        host: redisHost,
        port: redisPort,
        username: username,
        password: password,
        type: sourceCacheType,
        default_ttl: redisDefaultTtl,
      };

      return redisSource;
    } else {
      const redisSource: IRedisSource = {
        host: redisHost,
        port: redisPort,
        type: sourceCacheType,
        default_ttl: redisDefaultTtl,
      };

      return redisSource;
    }

    throw new NotFoundError('configuration is missing redis parameters');
  }
}

export { RedisSource };
