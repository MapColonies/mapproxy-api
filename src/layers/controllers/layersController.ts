import { RequestHandler } from 'express';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { Services } from '../../common/constants';
import { ILogger, ILayerPostRequest, ILayerToBestRequest, IBestLayer } from '../../common/interfaces';
import { LayersManager } from '../models/layersManager';

type CreateLayerHandler = RequestHandler<undefined, ILayerPostRequest, ILayerPostRequest>;
type GetLayerHandler = RequestHandler<undefined, ILayerPostRequest>;
type CreateBestHandler = RequestHandler<undefined, ILayerToBestRequest, ILayerToBestRequest>;
type GetBestHandler = RequestHandler<undefined, IBestLayer>;

@injectable()
export class LayersController {
  public constructor(@inject(Services.LOGGER) private readonly logger: ILogger, @inject(LayersManager) private readonly manager: LayersManager) {}

  public getLayer: GetLayerHandler = (req, res) => {
    return res.status(httpStatus.OK).json(this.manager.getLayer());
  };

  public addLayer: CreateLayerHandler = (req, res, next) => {
    try {
      this.manager.addLayer(req.body);
      return res.status(httpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  };

  public addLayerToBest: CreateBestHandler = (req, res, next) => {
    try {
      this.manager.addLayerToBest(req.body);
      return res.status(httpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  };
}
