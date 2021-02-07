import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { LayersController } from '../controllers/layersController';

const layersRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(LayersController);

  router.get('/layer', controller.getLayer);
  router.post('/layer', controller.addLayer);
  router.put('/layer/:name', controller.updateLayer);
  router.delete('/layer/:name', controller.removeLayer);
  router.post('/mosaic', controller.addLayerToMosaic);
  router.put('/mosaic', controller.updateMosaic);

  return router;
};

export { layersRouterFactory };
