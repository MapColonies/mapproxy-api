import { ILayerPostRequest } from '../../interfaces';

//TODO: remove mock data after contollers implementaion
export const mockLayer: ILayerPostRequest = {
  id: 1,
  name: 'amsterdam_5cm',
  tilesPath: '/path/to/s3/directory/tile',
  maxZoomLevel: 18,
  cacheType: 'fs',
};
