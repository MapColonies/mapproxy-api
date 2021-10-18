import { RequestHandler } from 'express';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { Services } from '../../common/constants';
import { ILogger, ILayerPostRequest, ILayerToMosaicRequest, IUpdateMosaicRequest, IMapProxyCache } from '../../common/interfaces';
import { LayersManager } from '../models/layersManager';

type CreateLayerHandler = RequestHandler<undefined, ILayerPostRequest, ILayerPostRequest>;
type GetLayerHandler = RequestHandler<{ name: string }, IMapProxyCache, IMapProxyCache>;
type CreateMosaicHandler = RequestHandler<{ name: string }, ILayerToMosaicRequest, ILayerToMosaicRequest>;
type UpdateLayerHandler = RequestHandler<{ name: string }, ILayerPostRequest, ILayerPostRequest>;
type PutMosaicHandler = RequestHandler<{ name: string }, IUpdateMosaicRequest, IUpdateMosaicRequest>;
type DeleteLayerHandler = RequestHandler<undefined, string[] | void, undefined, { layerNames: string[] }>;
@injectable()
export class LayersController {
  public constructor(@inject(Services.LOGGER) private readonly logger: ILogger, @inject(LayersManager) private readonly manager: LayersManager) {}

  public getLayer: GetLayerHandler = async (req, res, next) => {
    try {
      return res.status(httpStatus.OK).json(await this.manager.getLayer(req.params.name));
    } catch (error) {
      next(error);
    }
  };

  public addLayer: CreateLayerHandler = async (req, res, next) => {
    try {
      await this.manager.addLayer(req.body);
      return res.status(httpStatus.CREATED).send(req.body);
    } catch (error) {
      next(error);
    }
  };

  public updateLayer: UpdateLayerHandler = async (req, res, next) => {
    try {
      await this.manager.updateLayer(req.params.name, req.body);
      return res.sendStatus(httpStatus.ACCEPTED);
    } catch (error) {
      next(error);
    }
  };

  public removeLayer: DeleteLayerHandler = async (req, res, next) => {
    try {
      const failedLayers = await this.manager.removeLayer(req.query.layerNames);
      return res.status(httpStatus.OK).send(failedLayers);
    } catch (error) {
      next(error);
    }
  };

  public addLayerToMosaic: CreateMosaicHandler = async (req, res, next) => {
    try {
      await this.manager.addLayerToMosaic(req.params.name, req.body);
      return res.status(httpStatus.CREATED).send(req.body);
    } catch (error) {
      next(error);
    }
  };

  public updateMosaic: PutMosaicHandler = async (req, res, next) => {
    try {
      await this.manager.updateMosaic(req.params.name, req.body);
      return res.status(httpStatus.CREATED).send(req.body);
    } catch (error) {
      next(error);
    }
  };
}
