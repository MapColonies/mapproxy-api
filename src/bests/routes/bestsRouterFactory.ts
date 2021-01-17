import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { BestsController } from '../controllers/bestsController';

const bestsRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(BestsController);

  router.get('/', controller.getBest);
  router.post('/', controller.addLayerToBest);

  return router;
};

export { bestsRouterFactory };
