import { inject, injectable } from 'tsyringe';
import { Services } from '../../common/constants';
import { ILogger, LayerPostRequest } from '../../common/interfaces';
import { mockLayer } from '../../common/data/mock/mockLayer';

@injectable()
export class LayersManager {
  public constructor(@inject(Services.LOGGER) private readonly logger: ILogger) {}
  public getLayer(): LayerPostRequest {
    this.logger.log('info', 'get layer request');
    return mockLayer;
  }
  public addLayer(newLayer: LayerPostRequest): LayerPostRequest {
    this.logger.log('info', `add layer request: ${newLayer.name}`);
    return mockLayer;
  }
}
