import { Logger } from '@map-colonies/js-logger';
import { RequestHandler } from 'express';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { SERVICES } from '../../common/constants';
import { IMapProxyJsonDocument, SchemaType } from '../../common/interfaces';
import { ConfigsManager } from '../models/configsManager';
import { convertJsonToYaml } from '../../common/utils';

type GetConfigHandler = RequestHandler<undefined, IMapProxyJsonDocument | string, undefined>;
@injectable()
export class ConfigsController {
  public constructor(@inject(SERVICES.LOGGER) private readonly logger: Logger, @inject(ConfigsManager) private readonly manager: ConfigsManager) {}

  public getConfig: GetConfigHandler = async (req, res, next) => {
    try {
      const configJson = await this.manager.getConfig();
      let responseType = req.headers.accept;
      let response;
      if (responseType === SchemaType.YAML) {
        response = convertJsonToYaml(configJson);
      } else {
        response = configJson;
        responseType = SchemaType.JSON;
      }

      res.setHeader('Content-Type', responseType);
      return res.status(httpStatus.OK).send(response);
    } catch (error) {
      next(error);
    }
  };
}
