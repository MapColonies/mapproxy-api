/* eslint-disable @typescript-eslint/naming-convention */
import { DependencyContainer, inject } from 'tsyringe';
import { Logger } from '@map-colonies/js-logger';
import config from 'config';
import { NotFoundError } from '@map-colonies/error-types';
import { SERVICES } from '../constants';
import { ICacheProvider, IMapProxyConfig, IRedisSource } from '../interfaces';
import { SourceTypes } from '../enums';

class RedisSource implements ICacheProvider {
  private readonly mapproxyConfig: IMapProxyConfig;
  private readonly logger: Logger;
  sourceCacheType: SourceTypes;
  redisHost!: string;
  redisPort!: number;
  redisDefaultTtl!: number;
  isRedisUserPassowrdEnabled!: boolean;
  hasPrefix!: boolean;
  username!: string;
  password!: string;
  prefix!: string;
  redisSource!: IRedisSource;

  public constructor(container: DependencyContainer, grid?: string, cacheName?: string) {
    this.logger = container.resolve(SERVICES.LOGGER);
    this.mapproxyConfig = container.resolve(SERVICES.MAPPROXY);
    this.sourceCacheType = SourceTypes.REDIS;
    try {
      this.redisHost = config.get<string>('redis.host');
      this.redisPort = config.get<number>('redis.port');
      this.redisDefaultTtl = config.get<number>('redis.default_ttl');
      this.isRedisUserPassowrdEnabled = config.get<boolean>('redis.auth.enableRedisUser');
      this.hasPrefix = config.get<boolean>('redis.prefix.enablePrefix');

      const baseRedisCache: IRedisSource = {
        host: this.redisHost,
        port: this.redisPort,
        type: this.sourceCacheType,
        default_ttl: this.redisDefaultTtl,
      };
      this.redisSource = baseRedisCache;
      if (this.isRedisUserPassowrdEnabled) {
        const username = config.get<string>('redis.auth.username');
        const password = config.get<string>('redis.auth.password');
        this.redisSource = { ...this.redisSource, username: username, password: password };
      }
      if (this.hasPrefix) {
        const prefix = config.get<string>('redis.prefix.prefix');
        cacheName != undefined && grid != undefined
          ? (this.redisSource = { ...this.redisSource, prefix: `${prefix}${cacheName}_${grid}` })
          : (this.redisSource = { ...this.redisSource, prefix: prefix });
      }
    } catch {
      this.logger.error('configuration is missing redis parameters');
      throw new NotFoundError('configuration is missing redis parameters');
    }
  }

  public getCacheSource(): IRedisSource {
    return this.redisSource;
  }
}

export { RedisSource };
