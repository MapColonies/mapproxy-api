import { RequestHandler } from 'express';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { Services } from '../../common/constants';
import { ILogger, ILayerPostRequest, ILayerToMosaicRequest, IUpdateMosaicRequest, IMapProxyCache } from '../../common/interfaces';
import { LayersManager } from '../models/layersManager';

type CreateLayerHandler = RequestHandler<undefined, ILayerPostRequest, ILayerPostRequest>;
type GetLayerHandler = RequestHandler<{ name: string }, IMapProxyCache, IMapProxyCache>;
type CreateMosaicHandler = RequestHandler<undefined, ILayerToMosaicRequest, ILayerToMosaicRequest>;
type UpdateLayerHandler = RequestHandler<{ name: string }, ILayerPostRequest, ILayerPostRequest>;
type PutMosaicHandler = RequestHandler<undefined, IUpdateMosaicRequest, IUpdateMosaicRequest>;
type DeleteLayerHandler = RequestHandler<{ name: string }, string, string>;
@injectable()
export class LayersController {
  public constructor(@inject(Services.LOGGER) private readonly logger: ILogger, @inject(LayersManager) private readonly manager: LayersManager) {}

  public getLayer: GetLayerHandler = (req, res, next) => {
    try {
      return res.status(httpStatus.OK).json(this.manager.getLayer(req.params.name));
    } catch (error) {
      next(error);
    }
  };

  public addLayer: CreateLayerHandler = (req, res, next) => {
    try {
      this.manager.addLayer(req.body);
      return res.status(httpStatus.CREATED).send(req.body);
    } catch (error) {
      next(error);
    }
  };

  public updateLayer: UpdateLayerHandler = (req, res, next) => {
    try {
      this.manager.updateLayer(req.params.name, req.body);
      return res.sendStatus(httpStatus.ACCEPTED);
    } catch (error) {
      next(error);
    }
  };

  public removeLayer: DeleteLayerHandler = (req, res, next) => {
    try {
      this.manager.removeLayer(req.params.name);
      return res.sendStatus(httpStatus.ACCEPTED);
    } catch (error) {
      next(error);
    }
  };

  public addLayerToMosaic: CreateMosaicHandler = (req, res, next) => {
    try {
      this.manager.addLayerToMosaic(req.body);
      return res.status(httpStatus.CREATED).send(req.body);
    } catch (error) {
      next(error);
    }
  };

  public updateMosaic: PutMosaicHandler = (req, res, next) => {
    try {
      this.manager.updateMosaic(req.body);
      return res.status(httpStatus.CREATED).send(req.body);
    } catch (error) {
      next(error);
    }
  };
}
