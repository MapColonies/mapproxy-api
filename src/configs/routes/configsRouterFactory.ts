import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { ConfigsController } from '../controllers/configsController';

const configsRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(ConfigsController);
  router.get('/', controller.getConfig);

  return router;
};
export const CONFIGS_ROUTER_SYMBOL = Symbol('configsRouterFactory');
export { configsRouterFactory };
