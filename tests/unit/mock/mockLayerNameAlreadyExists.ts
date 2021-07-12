import { ILayerPostRequest } from '../../../src/common/interfaces';

//TODO: remove mock data after contollers implementaion
export const mockLayerNameAlreadyExists: ILayerPostRequest = {
  id: 1,
  name: 'NameIsAlreadyExists',
  tilesPath: '/path/to/s3/directory/tile',
  maxZoomLevel: 18,
  description: 'amsterdam 5m layer discription',
  cacheType: 'fs',
};
