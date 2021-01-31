import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { LayersController } from '../controllers/layersController';

const layersRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(LayersController);

  router.get('/', controller.getLayer);
  router.post('/', controller.addLayer);
  router.put('/:name', controller.updateLayer);
  router.delete('/:name', controller.removeLayer);
  router.post('/mosaic', controller.addLayerToMosaic);
  router.put('/mosaic', controller.reorderMosaic);

  return router;
};

export { layersRouterFactory };
