import { ILayerPostRequest } from '../../../src/common/interfaces';

//TODO: remove mock data after contollers implementaion
export const mockLayerNameIsNotExists: ILayerPostRequest = {
  id: 1,
  name: 'NameIsNotExists',
  tilesPath: '/path/to/s3/directory/tile',
  cacheType: 's3',
  // Runtime tests only need the underlying string value (avoid importing ESM deps in Jest).
  format: 'JPEG',
};
