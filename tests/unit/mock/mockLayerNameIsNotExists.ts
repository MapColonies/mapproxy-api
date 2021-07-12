import { ILayerPostRequest } from '../../../src/common/interfaces';

//TODO: remove mock data after contollers implementaion
export const mockLayerNameIsNotExists: ILayerPostRequest = {
  id: 1,
  name: 'NameIsNotExists',
  tilesPath: '/path/to/s3/directory/tile',
  maxZoomLevel: 18,
  description: 'amsterdam 5m layer discription',
  cacheType: 's3',
};
