import { RequestHandler } from 'express';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { Services } from '../../common/constants';
import { ILogger } from '../../common/interfaces';

import { IResourceNameModel, ResourceNameManager } from '../models/resourceNameManager';

type CreateResourceHandler = RequestHandler<undefined, IResourceNameModel, IResourceNameModel>;
type GetResourceHandler = RequestHandler<undefined, IResourceNameModel>;

@injectable()
export class ResourceNameController {
  public constructor(
    @inject(Services.LOGGER) private readonly logger: ILogger,
    @inject(ResourceNameManager) private readonly manager: ResourceNameManager
  ) {}
  public getResource: GetResourceHandler = (req, res) => {
    return res.status(httpStatus.OK).json(this.manager.getResource());
  };
  public createResource: CreateResourceHandler = (req, res) => {
    const createdResource = this.manager.createResource(req.body);
    return res.status(httpStatus.CREATED).json(createdResource);
  };
}
