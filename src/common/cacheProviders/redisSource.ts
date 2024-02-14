/* eslint-disable @typescript-eslint/naming-convention */
import { DependencyContainer } from 'tsyringe';
import { Logger } from '@map-colonies/js-logger';
import { SERVICES } from '../constants';
import { ICacheProvider, IMapProxyConfig, IRedisConfig, IRedisSource } from '../interfaces';
import { SourceTypes } from '../enums';

class RedisSource implements ICacheProvider {
  private readonly redisSourceCacheType: SourceTypes;
  private readonly redisConfig: IRedisConfig;
  private readonly logger: Logger;
  private readonly redisSource!: IRedisSource;

  public constructor(container: DependencyContainer, grid?: string, cacheName?: string) {
    this.logger = container.resolve(SERVICES.LOGGER);
    this.redisConfig = container.resolve(SERVICES.REDISCONFIG);
    this.redisSourceCacheType = SourceTypes.REDIS;
    try {
      const baseRedisCache: IRedisSource = {
        host: this.redisConfig.host,
        port: this.redisConfig.port,
        type: this.redisSourceCacheType,
        default_ttl: this.redisConfig.default_ttl,
      };
      this.redisSource = baseRedisCache;
      if (this.redisConfig.auth.enableRedisUser) {
        this.redisSource = { ...this.redisSource, username: this.redisConfig.auth.username, password: this.redisConfig.auth.password };
      }

      if (this.redisConfig.prefix.enablePrefix) {
        if (cacheName != undefined && grid != undefined) {
          this.redisSource = { ...this.redisSource, prefix: `${this.redisConfig.prefix.prefix}${cacheName}_${grid}` };
        } else {
          this.redisSource = { ...this.redisSource, prefix: this.redisConfig.prefix.prefix };
        }
      }
    } catch (err) {
      this.logger.error({ err: err, msg: 'configuration is missing redis parameters' });
      throw err;
    }
  }

  public getCacheSource(): IRedisSource {
    return this.redisSource;
  }
}

export { RedisSource };
