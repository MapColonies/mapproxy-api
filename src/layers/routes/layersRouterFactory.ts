import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { LayersController } from '../controllers/layersController';

const layersRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(LayersController);

  router.get('/layer/:name', controller.getLayer);
  router.post('/layer', controller.addLayer);
  router.put('/layer/:name', controller.updateLayer);
  router.delete('/layer', controller.removeLayer);
  // router.post('/mosaic/:name', controller.addLayerToMosaic);
  // router.put('/mosaic/:name', controller.updateMosaic);

  return router;
};
export const LAYERS_ROUTER_SYMBOL = Symbol('layersRouterFactory');
export { layersRouterFactory };
