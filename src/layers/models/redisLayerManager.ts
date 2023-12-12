/* eslint-disable @typescript-eslint/naming-convention */
import { container, inject, injectable } from 'tsyringe';
import { IMapProxyCache, IMapProxyLayer, IMapProxyConfig, IConfigProvider } from '../../common/interfaces';
import { RedisSource } from '../../common/cacheProviders/redisSource';

@injectable()
export class RedisLayersManager {
  public static createRedisLayer(redisLayerName: string): IMapProxyLayer {
    const layer: IMapProxyLayer = {
      name: redisLayerName,
      title: redisLayerName,
      sources: [redisLayerName],
    };
    return layer;
  }

  public static createRedisCache(
    originalLayerName: string,
    sourceLayerName: string,
    format: string,
    mapproxyConfig: IMapProxyConfig
  ): IMapProxyCache {
    const sourceProvider = new RedisSource(container);
    const grids = mapproxyConfig.cache.grids.split(',');
    const cacheType = sourceProvider.getCacheSource();
    if (cacheType.prefix) {
      cacheType.prefix = `${cacheType.prefix}${originalLayerName}`;
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
