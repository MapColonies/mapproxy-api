import { RequestHandler } from 'express';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { Services } from '../../common/constants';
import { ILogger, ILayerToBestRequest, IBestLayer } from '../../common/interfaces';
import { BestsManager } from '../models/bestsManager';

type CreateBestHandler = RequestHandler<undefined, ILayerToBestRequest, ILayerToBestRequest>;
type GetBestHandler = RequestHandler<undefined, IBestLayer>;

@injectable()
export class BestsController {
  public constructor(@inject(Services.LOGGER) private readonly logger: ILogger, @inject(BestsManager) private readonly manager: BestsManager) {}

  public getBest: GetBestHandler = (req, res) => {
    return res.status(httpStatus.OK).json(this.manager.getBest());
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
