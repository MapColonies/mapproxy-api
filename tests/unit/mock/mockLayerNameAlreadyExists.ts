import { TileFormat } from '../../../src/common/enums';
import { ILayerPostRequest } from '../../../src/common/interfaces';

//TODO: remove mock data after contollers implementaion
export const mockLayerNameAlreadyExists: ILayerPostRequest = {
  id: 1,
  name: 'NameIsAlreadyExists',
  tilesPath: '/path/to/s3/directory/tile',
  cacheType: 's3',
  format: TileFormat.JPEG,
};
