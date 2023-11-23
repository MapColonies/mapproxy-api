/* eslint-disable @typescript-eslint/naming-convention */
import { IMapProxyJsonDocument } from '../../../src/common/interfaces';

export const mockData = (): IMapProxyJsonDocument => {
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
    ],
  };
  return data as unknown as IMapProxyJsonDocument;
};
