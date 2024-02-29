/* eslint-disable @typescript-eslint/naming-convention */
import { IMapProxyJsonDocument } from '../../../src/common/interfaces';

export const mockData = (): IMapProxyJsonDocument => {
  const data = {
    caches: {
      mock: 'some content for unit-test',
      amsterdam_5cm: {
        sources: [],
        grids: ['epsg4326dir'],
        format: 'image/png',
        upscale_tiles: 18,
        cache: {
          type: 's3',
          directory: '/path/to/s3/directory/tile',
          directory_layout: 'tms',
        },
      },
      mockLayerNameExists: {
        sources: [],
        grids: ['epsg4326dir'],
        format: 'image/png',
        upscale_tiles: 18,
        cache: {
          type: 's3',
          directory: '/path/to/s3/directory/tile',
          directory_layout: 'tms',
        },
      },
      combined_layers: { sources: ['mock'], grids: ['epsg4326dir'] },
      NameIsAlreadyExists: {
        sources: [],
        grids: ['epsg4326dir'],
        format: 'image/png',
        upscale_tiles: 18,
        cache: {
          type: 's3',
          directory: '/path/to/s3/directory/tile',
          directory_layout: 'tms',
        },
        redisExists: {
          sources: [],
          grids: ['epsg4326dir'],
          format: 'image/png',
          upscale_tiles: 18,
          cache: {
            type: 's3',
            directory: '/path/to/s3/directory/tile',
            directory_layout: 'tms',
          },
        },
        'redisExists-redis': {
          sources: ['redisExists'],
          grids: ['epsg4326dir'],
          format: 'image/png',
          upscale_tiles: 18,
          cache: {
            type: 'redis',
            host: 'raster-mapproxy-redis-master',
            port: '6379',
            prefix: 'temp-prefix:',
            default_ttl: '86400',
          },
        },
      },
      layers: [
        {
          name: 'NameIsAlreadyExists',
          title: 'title',
          sources: ['NameIsAlreadyExists'],
        },
        {
          name: 'mockLayerNameExists',
          title: 'title',
          sources: ['mockLayerNameExists'],
        },
        { name: 'mock', title: 'title', sources: ['source'] },
        { name: 'mock2', title: 'title', sources: ['source'] },
        {
          name: 'amsterdam_5cm',
          title: 'amsterdam 5m layer discription',
          sources: ['amsterdam_5cm'],
        },
        {
          name: 'redisExists',
          title: 'redisExists-redis',
          sources: ['redisExists-redis'],
        },
      ],
    },
    grids: { epsg4326dir: 'ests' },
  };
  return data as unknown as IMapProxyJsonDocument;
};

export const mockFalseData = (): IMapProxyJsonDocument => {
  const data = {
    caches: {
      mock: 'some content for unit-test',
      'amsterdam_5cm-source': {
        sources: [],
        grids: ['epsg4326dir'],
        format: 'image/png',
        upscale_tiles: 18,
        cache: {
          type: 's3',
          directory: '/path/to/s3/directory/tile',
          directory_layout: 'tms',
        },
      },
      'mockLayerNameExists-source': {
        sources: [],
        grids: ['epsg4326dir'],
        format: 'image/png',
        upscale_tiles: 18,
        cache: {
          type: 's3',
          directory: '/path/to/s3/directory/tile',
          directory_layout: 'tms',
        },
      },
      combined_layers: { sources: ['mock'], grids: ['epsg4326dir'] },
      'NameIsAlreadyExists-source': {
        sources: [],
        grids: ['epsg4326dir'],
        format: 'image/png',
        upscale_tiles: 18,
        cache: {
          type: 's3',
          directory: '/path/to/s3/directory/tile',
          directory_layout: 'tms',
        },
        'redisExists-source': {
          sources: [],
          grids: ['epsg4326dir'],
          format: 'image/png',
          upscale_tiles: 18,
          cache: {
            type: 's3',
            directory: '/path/to/s3/directory/tile',
            directory_layout: 'tms',
          },
        },
        redisExists: {
          sources: ['redisExists-source'],
          grids: ['epsg4326dir'],
          format: 'image/png',
          upscale_tiles: 18,
          cache: {
            type: 'redis',
            host: 'raster-mapproxy-redis-master',
            port: '6379',
            prefix: 'temp-prefix:',
            default_ttl: '86400',
          },
        },
        existsMosaicName: {
          sources: ['bluemar', 'planet', 'artzi'],
          grids: ['epsg4326'],
        },
      },
      layers: [
        {
          name: 'NameIsAlreadyExists-source',
          title: 'title',
          sources: ['NameIsAlreadyExists-source'],
        },
        {
          name: 'mockLayerNameExists-source',
          title: 'title',
          sources: ['mockLayerNameExists-source'],
        },
        { name: 'mock', title: 'title', sources: ['source'] },
        { name: 'mock2', title: 'title', sources: ['source'] },
        {
          name: 'amsterdam_5cm-source',
          title: 'amsterdam 5m layer discription',
          sources: ['amsterdam_5cm-source'],
        },
        {
          name: 'redisExists',
          title: 'redisExists',
          sources: ['redisExists'],
        },
      ],
    },
    grids: { epsg1111: 'ests' },
  };
  return data as unknown as IMapProxyJsonDocument;
};
