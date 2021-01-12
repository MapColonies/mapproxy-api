import { inject, injectable } from 'tsyringe';
import { Services } from '../../common/constants';
import { ILogger, LayerPostRequest } from '../../common/interfaces';

const mockLayer: LayerPostRequest = {
  id: 1,
  name: 'amsterdam_5cm',
  tilesPath: '/path/to/s3/directory/tile',
  maxZoomLevel: 18,
  description: 'amsterdam 5m layer discription',
};

@injectable()
export class LayersManager {
  public constructor(@inject(Services.LOGGER) private readonly logger: ILogger) {}
  public getLayer(): LayerPostRequest {
    this.logger.log('info', 'get layer request');
    return mockLayer;
  }
  public addLayer(newLayer: LayerPostRequest): LayerPostRequest {
    this.logger.log('info', `add layer request`);
    this.logger.log('info', newLayer.name);

    return mockLayer;
  }
}
