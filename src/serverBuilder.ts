import express from 'express';
import bodyParser from 'body-parser';
import { middleware as OpenApiMiddleware } from 'express-openapi-validator';
import { container, inject, injectable } from 'tsyringe';
import { RequestLogger } from './common/middlewares/RequestLogger';
import { Services } from './common/constants';
import { IConfig, ILogger } from './common/interfaces';
import { layersRouterFactory } from './layers/routes/layersRouterFactory';
import { openapiRouterFactory } from './common/routes/openapi';
import { ErrorHandler } from './common/middlewares/ErrorHanlder';
import { RollBackErrorHandler } from './common/middlewares/RollBackErrorHandler';

@injectable()
export class ServerBuilder {
  private readonly serverInstance = express();

  public constructor(
    @inject(Services.CONFIG) private readonly config: IConfig,
    private readonly requestLogger: RequestLogger,
    @inject(Services.LOGGER) private readonly logger: ILogger,
    private readonly errorHandler: ErrorHandler,
    private readonly rollbackErrorHandler: RollBackErrorHandler
  ) {
    this.serverInstance = express();
  }

  public build(): express.Application {
    this.registerPreRoutesMiddleware();
    this.buildRoutes();
    this.registerPostRoutesMiddleware();

    return this.serverInstance;
  }

  private buildRoutes(): void {
    this.serverInstance.use('/', layersRouterFactory(container));
    this.serverInstance.use('/', openapiRouterFactory(container));
  }

  private registerPreRoutesMiddleware(): void {
    this.serverInstance.use(bodyParser.json());

    const ignorePathRegex = new RegExp(`^${this.config.get<string>('openapiConfig.basePath')}/.*`, 'i');
    const apiSpecPath = this.config.get<string>('openapiConfig.filePath');

    this.serverInstance.use(OpenApiMiddleware({ apiSpec: apiSpecPath, validateRequests: true, ignorePaths: ignorePathRegex }));
    this.serverInstance.use(this.requestLogger.getLoggerMiddleware());
  }

  private registerPostRoutesMiddleware(): void {
    this.serverInstance.use(this.rollbackErrorHandler.getRollBackHandlerMiddleware())
    this.serverInstance.use(this.errorHandler.getErrorHandlerMiddleware());
  }
}
