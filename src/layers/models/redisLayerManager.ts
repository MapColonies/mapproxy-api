/* eslint-disable @typescript-eslint/naming-convention */
import { container, inject, injectable } from 'tsyringe';
import { IMapProxyCache, IMapProxyLayer, IMapProxyConfig, IConfigProvider } from '../../common/interfaces';
import { RedisSource } from '../../common/cacheProviders/redisSource';

@injectable()
export class RedisLayersManager {
  public static createRedisLayer(redisLayerName: string, sourceLayerName: string): IMapProxyLayer {
    const layer: IMapProxyLayer = {
      name: redisLayerName,
      title: redisLayerName,
      sources: [sourceLayerName],
    };
    return layer;
  }

  public static createRedisCache(sourceLayerName: string, format: string, mapproxyConfig: IMapProxyConfig): IMapProxyCache {
    const sourceProvider = new RedisSource(container);
    const grids = mapproxyConfig.cache.grids.split(',');
    const upscaleTiles = mapproxyConfig.cache.upscaleTiles;
    const cacheType = sourceProvider.getCacheSource();

    const cache: IMapProxyCache = {
      sources: [sourceLayerName],
      grids: grids,
      upscale_tiles: upscaleTiles,
      cache: cacheType,
      format: format,
      minimize_meta_requests: true,
    };

    return cache;
  }
}
