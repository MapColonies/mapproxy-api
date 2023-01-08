import httpStatusCodes from 'http-status-codes';
import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import config from 'config';
import { container } from 'tsyringe';
import { TileOutputFormat } from '@map-colonies/mc-model-types';
import {
  IFSConfig,
  ILayerPostRequest,
  ILayerToMosaicRequest,
  IMapProxyCache,
  IMapProxyConfig,
  IS3Config,
  IUpdateMosaicRequest,
} from '../../../src/common/interfaces';
import { mockLayerNameIsNotExists } from '../../unit/mock/mockLayerNameIsNotExists';
import { mockLayerNameAlreadyExists } from '../../unit/mock/mockLayerNameAlreadyExists';
import { MockConfigProvider, init as configProviderInit } from '../../unit/mock/mockConfigProvider';
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
      const notFoundErrorMessage = `Layer name '${mockLayerName}' is not exists`;

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
      const conflictErrorMessage = `Layer name '${mockLayerNameAlreadyExists.name}' is already exists`;

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
      const response = await requestSender.updateLayer(mockLayerNameAlreadyExists.name, mockUpdateLayerRequest);

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
      const notFoundErrorMessage = `Layer name '${mockLayerNameIsNotExists.name}' is not exists`;

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
  });

  describe('#addLayerToMosaic', () => {
    const mockMosaicName = 'existsMosaicName';
    const mockLayerToMosaicRequest: ILayerToMosaicRequest = {
      layerName: 'mockLayerNameExists',
    };

    it('Happy Path - should return status 201', async () => {
      const response = await requestSender.addLayerToMosaic(mockMosaicName, mockLayerToMosaicRequest);

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.CREATED);
    });

    it('Bad Path - should fail with response status 400 Bad Request', async () => {
      const mockMosaicName = 'mosaicMockName';
      // mocking bad request with invalid field 'mockName' to test BadRequest status
      const mockBadRequestRequest = {
        mockName: 'layerNameIsNotExists',
      } as unknown as ILayerToMosaicRequest;
      const response = await requestSender.addLayerToMosaic(mockMosaicName, mockBadRequestRequest);

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
    });

    it('Sad Path - should fail with response status 404 Not Found and layer name is not exists', async () => {
      const mockMosaicName = 'existsMosaicName';
      const mockLayerNotExistsRequest: ILayerToMosaicRequest = {
        layerName: 'layerNameIsNotExists',
      };

      const response = await requestSender.addLayerToMosaic(mockMosaicName, mockLayerNotExistsRequest);
      const notFoundErrorMessage = `Layer name '${mockLayerNotExistsRequest.layerName}' is not exists`;

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
      expect(response.body).toEqual({ message: notFoundErrorMessage });
    });

    // eslint-disable-next-line jest/no-identical-title
    it('Sad Path - should fail with response status 404 Not Found and mosaic name is not exists', async () => {
      const mockMosaicName = 'mosaicMockNameIsNotExists';
      const mockMosaicNotExistsRequest: ILayerToMosaicRequest = {
        layerName: 'mockLayerNameExists',
      };

      const response = await requestSender.addLayerToMosaic(mockMosaicName, mockMosaicNotExistsRequest);

      expect(response).toSatisfyApiSpec();
      const notFoundErrorMessage = `Mosaic name '${mockMosaicName}' is not exists`;

      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
      expect(response.body).toEqual({ message: notFoundErrorMessage });
    });
  });

  describe('#updateMosaic', () => {
    const mockMosaicName = 'existsMosaicName';
    const mockUpdateMosaicRequest: IUpdateMosaicRequest = {
      layers: [
        { layerName: 'amsterdam_5cm', zIndex: 1 },
        { layerName: 'NameIsAlreadyExists', zIndex: 0 },
      ],
    };

    it('Happy Path - should return status 201', async () => {
      const response = await requestSender.updateMosaic(mockMosaicName, mockUpdateMosaicRequest);

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.CREATED);
    });

    it('Bad Path - should fail with response status 400 Bad Request', async () => {
      const mockMosaicName = 'existsMosaicName';
      const mockBadRequest = {
        // mocking bad request with invalid field 'mockName' to test BadRequest status
        layers: [
          { mockName: 'amsterdam_5cm', zIndex: 1 },
          { mockName: 'LayerNameIsNotExists', zIndex: 0 },
        ],
      } as unknown as IUpdateMosaicRequest;
      const response = await requestSender.updateMosaic(mockMosaicName, mockBadRequest);

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
    });

    it('Sad Path - should fail with response status 404 Not Found and layer name is not exists', async () => {
      const mockMosaicName = 'existsMosaicName';
      const mockLayerNotExistsRequest: IUpdateMosaicRequest = {
        layers: [
          { layerName: 'amsterdam_5cm', zIndex: 1 },
          { layerName: 'LayerNameIsNotExists', zIndex: 0 },
        ],
      };

      const response = await requestSender.updateMosaic(mockMosaicName, mockLayerNotExistsRequest);
      const notFoundErrorMessage = `Layer name '${mockLayerNotExistsRequest.layers[1].layerName}' is not exists`;

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
      expect(response.body).toEqual({ message: notFoundErrorMessage });
    });

    // eslint-disable-next-line jest/no-identical-title
    it('Sad Path - should fail with response status 404 Not Found and mosaic name is not exists', async () => {
      const mockMosaicName = 'NotExistsMosaicName';
      const mockMosaicNotExistsRequest: IUpdateMosaicRequest = {
        layers: [
          { layerName: 'amsterdam_5cm', zIndex: 1 },
          { layerName: 'NameIsAlreadyExists', zIndex: 0 },
        ],
      };

      const response = await requestSender.updateMosaic(mockMosaicName, mockMosaicNotExistsRequest);
      const notFoundErrorMessage = `Mosaic name '${mockMosaicName}' is not exists`;

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
      expect(response.body).toEqual({ message: notFoundErrorMessage });
    });
  });
});
