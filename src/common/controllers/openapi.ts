import { readFileSync } from 'fs';
import * as openapiUi from 'swagger-ui-express';
import { Request, Response, RequestHandler } from 'express';
import { safeLoad } from 'js-yaml';
import { injectable, inject } from 'tsyringe';
import { IConfig } from 'config';
import { Services } from '../constants';
import { ILogger, OpenApiConfig } from '../interfaces';
@injectable()
export class OpenapiController {
  public uiMiddleware: RequestHandler[];
  public serveUi: RequestHandler;

  private readonly openapiDoc: openapiUi.JsonObject;

  public constructor(@inject(Services.LOGGER) private readonly logger: ILogger, @inject(Services.CONFIG) private readonly config: IConfig) {
    const openapiConfig = config.get<OpenApiConfig>('openapiConfig');

    this.openapiDoc = safeLoad(readFileSync(openapiConfig.filePath, 'utf8')) as openapiUi.JsonObject;
    this.serveUi = openapiUi.setup(this.openapiDoc);
    this.uiMiddleware = openapiUi.serve;
  }

  public serveJson(req: Request, res: Response): void {
    res.json(this.openapiDoc);
  }
}
