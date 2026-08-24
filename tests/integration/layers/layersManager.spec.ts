import { promises as fsp } from 'node:fs';
import httpStatusCodes from 'http-status-codes';
import { container } from 'tsyringe';
import { ILayerPostRequest, IMapProxyCache } from '../../../src/common/interfaces';
import { mockLayerNameIsNotExists } from '../../unit/mock/mockLayerNameIsNotExists';
import { mockLayerNameAlreadyExists } from '../../unit/mock/mockLayerNameAlreadyExists';
import { init as configProviderInit, updateJsonMock } from '../../unit/mock/mockConfigProvider';
import { getApp } from '../../../src/app';
import { layersRouterFactory, LAYERS_ROUTER_SYMBOL } from '../../../src/layers/routes/layersRouterFactory';
import { LayersRequestSender } from '../layers/helpers/requestSender';
import { mockData, mockFalseData } from '../../unit/mock/mockData';
import { ConfigsManager } from '../../../src/configs/models/configsManager';
import { initConfig as initBoilerplateConfig } from '../../../src/common/config';
import { getTestContainerConfig } from '../testContainerConfig';

let requestSender: LayersRequestSender;

describe('layerManager', () => {
  beforeEach(async () => {
    await initBoilerplateConfig(true);
    configProviderInit();

    const [app] = await getApp({
      override: await getTestContainerConfig([{ token: LAYERS_ROUTER_SYMBOL, provider: { useFactory: layersRouterFactory } }]),
      useChild: false,
    });
    //container.resolve<ServerBuilder>(ServerBuilder);
    requestSender = new LayersRequestSender(app);
    jest.spyOn(fsp, 'writeFile').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
    jest.clearAllMocks();
    container.reset();
    container.clearInstances();
  });

  describe('#getLayer', () => {
    it('Happy Path - should return status 200 and the layer', async () => {
      const response = await requestSender.getLayer('mockLayerNameExists');

      expect(response.status).toBe(httpStatusCodes.OK);

      const resource = response.body as IMapProxyCache;
      expect(response).toSatisfyApiSpec();
      expect(resource.sources).toEqual([]);
      expect(resource.upscale_tiles).toBe(18);
      expect(resource.format).toBe('image/png');
      expect(resource.grids).toEqual(['epsg4326dir']);
      // eslint-disable-next-line @typescript-eslint/naming-convention
      expect(resource.cache).toEqual({ directory: '/path/to/s3/directory/tile', directory_layout: 'tms', type: 's3' });
    });

    it('Sad Path - should fail with response status 404 Not Found and layer name is not exists', async () => {
      const mockLayerName = 'mockLayerNameIsNotExists';
      const response = await requestSender.getLayer(mockLayerName);
      const notFoundErrorMessage = `Layer name '${mockLayerName}' does not exist`;

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
      expect(response.body).toEqual({ message: notFoundErrorMessage });
    });
  });

  describe('#getLayersCache', () => {
    it('Happy Path - should return status 200 and the whole Cache of an s3 Cache', async () => {
      const response = await requestSender.getLayersCache('mockLayerNameExists', 's3');

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(response).toSatisfyApiSpec();
      expect(response.body).toEqual({
        cacheName: 'mockLayerNameExists',
        sources: [],
        grids: ['epsg4326dir'],
        format: 'image/png',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        upscale_tiles: 18,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        cache: { type: 's3', directory: '/path/to/s3/directory/tile', directory_layout: 'tms' },
      });
    });

    it('Happy Path - should resolve a redis request to the -redis Cache and return it whole', async () => {
      const response = await requestSender.getLayersCache('redisExists', 'redis');

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(response).toSatisfyApiSpec();
      expect(response.body).toEqual({
        cacheName: 'redisExists-redis',
        sources: ['redisExists'],
        grids: ['epsg4326dir'],
        format: 'image/png',
        cache: {
          host: 'raster-mapproxy-redis-master',
          port: 6379,
          username: 'mapcolonies',
          password: 'mapcolonies',
          prefix: 'mcrl:',
          type: 'redis',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          default_ttl: 86400,
        },
      });
    });

    it('Happy Path - should return mapproxy options this service does not model, verbatim', async () => {
      const response = await requestSender.getLayersCache('NameIsAlreadyExists', 's3');

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(response).toSatisfyApiSpec();
      expect(response.body).toHaveProperty('link_single_color_images', true);
      expect(response.body).toHaveProperty('cache.region', 'us-east-1');
    });

    it('Sad Path - should fail with response status 404 Not Found and layer name is not exists', async () => {
      const mockLayerName = 'mockLayerNameIsNotExists';
      const response = await requestSender.getLayersCache(mockLayerName, 's3');
      const notFoundErrorMessage = `${mockLayerName} layer not found on mapproxy configuration`;

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
      expect(response.body).toEqual({ message: notFoundErrorMessage });
    });

    it('Sad Path - should fail with response status 400 when the Cache is of another Cache Type', async () => {
      const mockLayerName = 'mockLayerNameExists';
      const cacheType = 'file';
      const response = await requestSender.getLayersCache(mockLayerName, cacheType);
      const badRequestMessage = `${mockLayerName} layer cache not found with requested cache type: ${cacheType}`;

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
      expect(response.body).toEqual({ message: badRequestMessage });
    });

    it('Sad Path - should fail with response status 404 when the Layer has no Cache under the resolved name', async () => {
      const mockLayerName = 'noCacheForLayer';
      const response = await requestSender.getLayersCache(mockLayerName, 's3');
      const notFoundErrorMessage = `cache not found for ${mockLayerName} layer`;

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
      expect(response.body).toEqual({ message: notFoundErrorMessage });
    });

    it('Sad Path - should fail with response status 400 when the configuration entry is not an object', async () => {
      const mockLayerName = 'mock';
      const response = await requestSender.getLayersCache(mockLayerName, 's3');
      const badRequestMessage = `${mockLayerName} layer cache not found with requested cache type: s3`;

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
      expect(response.body).toEqual({ message: badRequestMessage });
    });

    it('Sad Path - should fail with response status 400 when the configuration entry holds no Cache Source', async () => {
      const mockLayerName = 'combined_layers';
      const response = await requestSender.getLayersCache(mockLayerName, 's3');
      const badRequestMessage = `${mockLayerName} layer cache not found with requested cache type: s3`;

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
      expect(response.body).toEqual({ message: badRequestMessage });
    });

    it('Sad Path - should fail with error not valid type format', async () => {
      const mockLayerName = 'mockLayerNameIsExists';
      const cacheType = 'notValid';
      const response = await requestSender.getLayersCache(mockLayerName, cacheType);
      const badRequestMessage = `request/params/cacheType must be equal to one of the allowed values: s3, file, redis, geopackage`;

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
      expect(response.body).toEqual({ message: badRequestMessage });
    });
  });

  describe('#addLayer', () => {
    it('Happy Path - should return status 201', async () => {
      jest.spyOn(ConfigsManager.prototype, 'getConfig').mockResolvedValue(mockData());
      const response = await requestSender.addLayer(mockLayerNameIsNotExists);

      expect(response.status).toBe(httpStatusCodes.CREATED);
    });

    it('Bad Path - should fail with response status 400 Bad Request due to wrong grid', async () => {
      jest.spyOn(ConfigsManager.prototype, 'getConfig').mockResolvedValue(mockFalseData());
      const response = await requestSender.addLayer(mockLayerNameIsNotExists);

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
    });

    it('Bad Path - should fail with response status 400 Bad Request', async () => {
      const mockBadRequestRequest = {
        // mocking bad request with invalid field 'mockName' to test BadRequest status
        mockName: 'NameIsNotExists',
        tilesPath: '/path/to/s3/directory/tile',
      } as unknown as ILayerPostRequest;
      const response = await requestSender.addLayer(mockBadRequestRequest);
      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
    });

    it('Sad Path - should fail with response status 409 and layer name is already exists', async () => {
      jest.spyOn(ConfigsManager.prototype, 'getConfig').mockResolvedValue(mockData());
      const response = await requestSender.addLayer(mockLayerNameAlreadyExists);
      const conflictErrorMessage = `Layer name '${mockLayerNameAlreadyExists.name}' already exists`;

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.CONFLICT);
      expect(response.body).toEqual({ message: conflictErrorMessage });
    });
  });

  describe('#updateLayer', () => {
    const mockUpdateLayerRequest: ILayerPostRequest = {
      name: 'amsterdam_5cm',
      tilesPath: '/path/to/tiles/directory/in/my/bucket/',
      cacheType: 's3',
      format: 'JPEG',
    };

    it('Happy Path - should return status 202', async () => {
      jest.spyOn(ConfigsManager.prototype, 'getConfig').mockResolvedValue(mockData());
      const response = await requestSender.updateLayer(`${mockLayerNameAlreadyExists.name}`, mockUpdateLayerRequest);

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.ACCEPTED);
    });

    it('Bad Path - should fail with response status 400 Bad Request', async () => {
      jest.spyOn(ConfigsManager.prototype, 'getConfig').mockResolvedValue(mockData());
      const mockBadRequest = {
        // mocking bad request with invalid field 'mockName' to test BadRequest status
        mockName: 'amsterdam_5cm',
        tilesPath: '/path/to/tiles/directory/in/my/bucket/',
      } as unknown as ILayerPostRequest;

      const response = await requestSender.updateLayer(mockLayerNameAlreadyExists.name, mockBadRequest);

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
    });

    it('Bad Path - should fail with response status 400 Bad Request due to grid not in global grids', async () => {
      jest.spyOn(ConfigsManager.prototype, 'getConfig').mockResolvedValue(mockFalseData());
      const response = await requestSender.updateLayer(`${mockLayerNameAlreadyExists.name}-source`, mockUpdateLayerRequest);

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
    });

    it('Sad Path - should fail with response status 404 Not Found and layer name is not exists', async () => {
      jest.spyOn(ConfigsManager.prototype, 'getConfig').mockResolvedValue(mockData());
      const response = await requestSender.updateLayer(mockLayerNameIsNotExists.name, mockUpdateLayerRequest);
      const notFoundErrorMessage = `Cache name '${mockLayerNameIsNotExists.name}' does not exists`;

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
      expect(response.body).toEqual({ message: notFoundErrorMessage });
    });
  });

  describe('#removeLayer', () => {
    it('Happy Path - should return status 200', async () => {
      const mockLayerNames = ['mockLayerNameExists', 'NameIsAlreadyExists'];
      const response = await requestSender.removeLayer(mockLayerNames);

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.OK);
    });

    it('sad Path - should return status 500', async () => {
      const mockLayerNames = ['mockLayerNameExists-redis', 'NameIsAlreadyExists'];
      updateJsonMock.mockImplementation(() => {
        throw new Error('some problem');
      });
      const response = await requestSender.removeLayer(mockLayerNames);

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.NOT_IMPLEMENTED);
    });
  });
});
