import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { LayersController } from '../controllers/layersController';

const layersRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(LayersController);

  router.get('/', controller.getLayer);
  router.post('/', controller.addLayer);
  router.post('/mosaic', controller.addLayerToMosaic);

  return router;
};

export { layersRouterFactory };
