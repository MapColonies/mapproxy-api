/* eslint-disable @typescript-eslint/naming-convention */
import { container, injectable } from 'tsyringe';
import { IMapProxyCache, IMapProxyLayer, IMapProxyConfig } from '../../common/interfaces';
import { RedisSource } from '../../common/cacheProviders/redisSource';

@injectable()
export class RedisLayersManager {
  public static createRedisCache(
    originalLayerName: string,
    sourceLayerName: string,
    format: string,
    mapproxyConfig: IMapProxyConfig
  ): IMapProxyCache {
    const sourceProvider = new RedisSource(container);
    const grids = mapproxyConfig.cache.grids.split(',');
    const cacheType = sourceProvider.getCacheSource();
    if (cacheType.prefix != null) {
      cacheType.prefix = `${cacheType.prefix}${originalLayerName}_${grids[0]}`;
    }

    const cache: IMapProxyCache = {
      sources: [sourceLayerName],
      grids: grids,
      cache: cacheType,
      format: format,
    };

    return cache;
  }
}
