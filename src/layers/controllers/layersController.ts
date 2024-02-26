import { Logger } from '@map-colonies/js-logger';
import { RequestHandler } from 'express';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { SERVICES } from '../../common/constants';
import { ILayerPostRequest, IMapProxyCache } from '../../common/interfaces';
import { LayersManager } from '../models/layersManager';

type CreateLayerHandler = RequestHandler<undefined, ILayerPostRequest, ILayerPostRequest>;
type GetLayerHandler = RequestHandler<{ name: string }, IMapProxyCache, IMapProxyCache>;
type UpdateLayerHandler = RequestHandler<{ name: string }, ILayerPostRequest, ILayerPostRequest>;
type DeleteLayerHandler = RequestHandler<undefined, string[] | void, undefined, { layerNames: string[] }>;
@injectable()
export class LayersController {
  public constructor(@inject(SERVICES.LOGGER) private readonly logger: Logger, @inject(LayersManager) private readonly manager: LayersManager) {}

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
      return res.status(httpStatus.ACCEPTED).send(req.body);
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
}
