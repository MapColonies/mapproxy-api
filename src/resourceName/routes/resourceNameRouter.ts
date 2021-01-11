import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { ResourceNameController } from '../controllers/resourceNameController';

const resourceNameRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(ResourceNameController);

  router.get('/', controller.getResource);
  router.post('/', controller.createResource);

  return router;
};

export { resourceNameRouterFactory };
