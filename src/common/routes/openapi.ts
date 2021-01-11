import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { OpenapiController } from '../controllers/openapi';
import { Services } from '../constants';
import { IConfig, OpenApiConfig } from '../interfaces';

const openapiRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const controller = dependencyContainer.resolve(OpenapiController);
  const config = dependencyContainer.resolve<IConfig>(Services.CONFIG);
  const openapiConfig = config.get<OpenApiConfig>('openapiConfig');

  const openapiRouter = Router();

  const openapiJsonPath = openapiConfig.basePath + openapiConfig.jsonPath;
  if (openapiJsonPath && openapiJsonPath !== '') {
    openapiRouter.get(openapiJsonPath, controller.serveJson.bind(controller));
  }

  const openapiUiPath = openapiConfig.basePath + openapiConfig.uiPath;
  openapiRouter.use(openapiUiPath, controller.uiMiddleware, controller.serveUi);

  return openapiRouter;
};

export { openapiRouterFactory };
