import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { LayersController } from '../controllers/layersController';

const layersRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(LayersController);

  router.get('/layer/:name', controller.getLayer);
  router.get('/layer/:name/:type', controller.getLayersCache);
  router.post('/layer', controller.addLayer);
  router.put('/layer/:name', controller.updateLayer);
  router.delete('/layer', controller.removeLayer);
  return router;
};
export const LAYERS_ROUTER_SYMBOL = Symbol('layersRouterFactory');
export { layersRouterFactory };
