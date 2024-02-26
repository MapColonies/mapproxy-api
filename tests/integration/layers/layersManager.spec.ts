/* eslint-disable jest/no-commented-out-tests */
import httpStatusCodes from 'http-status-codes';
import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import config from 'config';
import { container } from 'tsyringe';
import { TileOutputFormat } from '@map-colonies/mc-model-types';
import { IFSConfig, ILayerPostRequest, IMapProxyCache, IMapProxyConfig, IS3Config } from '../../../src/common/interfaces';
import { mockLayerNameIsNotExists } from '../../unit/mock/mockLayerNameIsNotExists';
import { mockLayerNameAlreadyExists } from '../../unit/mock/mockLayerNameAlreadyExists';
import { MockConfigProvider, init as configProviderInit, updateJsonMock } from '../../unit/mock/mockConfigProvider';
import * as utils from '../../../src/common/utils';
import { getApp } from '../../../src/app';
import { SERVICES } from '../../../src/common/constants';
import { layersRouterFactory, LAYERS_ROUTER_SYMBOL } from '../../../src/layers/routes/layersRouterFactory';
import { LayersRequestSender } from '../layers/helpers/requestSender';

let requestSender: LayersRequestSender;
describe('layerManager', () => {
  beforeEach(() => {
    const mapproxyConfig = config.get<IMapProxyConfig>('mapproxy');
    const fsConfig = config.get<IFSConfig>('FS');
    const s3Config = config.get<IS3Config>('S3');
    const redisConfig = config.get<IMapProxyConfig>('redis');
    configProviderInit();
    /* eslint-disable-next-line @typescript-eslint/naming-convention*/
    const app = getApp({
      override: [
        { token: SERVICES.MAPPROXY, provider: { useValue: mapproxyConfig } },
        { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
        { token: SERVICES.TRACER, provider: { useValue: trace.getTracer('testTracer') } },
        { token: SERVICES.CONFIG, provider: { useValue: config } },
        { token: LAYERS_ROUTER_SYMBOL, provider: { useFactory: layersRouterFactory } },
        { token: SERVICES.FS, provider: { useValue: fsConfig } },
        { token: SERVICES.S3, provider: { useValue: s3Config } },
        { token: SERVICES.REDISCONFIG, provider: { useValue: redisConfig } },
        {
          token: SERVICES.CONFIGPROVIDER,
          provider: {
            useValue: MockConfigProvider,
          },
        },
      ],
      useChild: false,
    });
    //container.resolve<ServerBuilder>(ServerBuilder);
    requestSender = new LayersRequestSender(app);
    jest.spyOn(utils, 'replaceYamlFileContent').mockResolvedValue(undefined);
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

  describe('#addLayer', () => {
    it('Happy Path - should return status 201', async () => {
      const response = await requestSender.addLayer(mockLayerNameIsNotExists);

      expect(response.status).toBe(httpStatusCodes.CREATED);
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
      format: TileOutputFormat.JPEG,
    };

    it('Happy Path - should return status 202', async () => {
      const response = await requestSender.updateLayer(`${mockLayerNameAlreadyExists.name}`, mockUpdateLayerRequest);

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.ACCEPTED);
    });

    it('Bad Path - should fail with response status 400 Bad Request', async () => {
      const mockBadRequest = {
        // mocking bad request with invalid field 'mockName' to test BadRequest status
        mockName: 'amsterdam_5cm',
        tilesPath: '/path/to/tiles/directory/in/my/bucket/',
      } as unknown as ILayerPostRequest;

      const response = await requestSender.updateLayer(mockLayerNameAlreadyExists.name, mockBadRequest);

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
    });

    it('Sad Path - should fail with response status 404 Not Found and layer name is not exists', async () => {
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
