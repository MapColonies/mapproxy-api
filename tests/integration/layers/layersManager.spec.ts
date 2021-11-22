import { readFileSync } from 'fs';
import httpStatusCodes from 'http-status-codes';
import { container } from 'tsyringe';
import { ILayerPostRequest, ILayerToMosaicRequest, IMapProxyCache, IUpdateMosaicRequest } from '../../../src/common/interfaces';
import { mockLayerNameIsNotExists } from '../../unit/mock/mockLayerNameIsNotExists';
import { mockLayerNameAlreadyExists } from '../../unit/mock/mockLayerNameAlreadyExists';
import { registerTestValues } from '../testContainerConfig';
import { MockConfigProvider } from '../../unit/mock/mockConfigProvider';
import * as utils from '../../../src/common/utils';
import * as requestSender from './helpers/requestSender';

let mockJsonData: string;
describe('layerManager', function () {
  beforeAll(function () {
    mockJsonData = readFileSync('tests/unit/mock/mockJson.json', 'utf8');
  });

  beforeEach(function () {
    registerTestValues();
    requestSender.init();
    jest.spyOn(MockConfigProvider.prototype, 'getJson').mockResolvedValue(JSON.parse(mockJsonData));
    jest.spyOn(MockConfigProvider.prototype, 'updateJson').mockResolvedValue(undefined);
    jest.spyOn(utils, 'replaceYamlFileContent').mockResolvedValue(undefined);
  });
  afterEach(function () {
    jest.resetAllMocks();
    jest.restoreAllMocks();
    container.clearInstances();
  });

  describe('#getLayer', function () {
    it('Happy Path - should return status 200 and the layer', async function () {
      const response = await requestSender.getLayer('mockLayerNameExists');

      expect(response.status).toBe(httpStatusCodes.OK);

      const resource = response.body as IMapProxyCache;
      expect(resource.sources).toEqual([]);
      expect(resource.upscale_tiles).toEqual(18);
      expect(resource.request_format).toEqual('image/png');
      expect(resource.grids).toEqual(['epsg4326dir']);
      // eslint-disable-next-line @typescript-eslint/naming-convention
      expect(resource.cache).toEqual({ directory: '/path/to/s3/directory/tile', directory_layout: 'tms', type: 's3' });
    });

    it('Sad Path - should fail with response status 404 Not Found and layer name is not exists', async function () {
      const mockLayerName = 'mockLayerNameIsNotExists';
      const response = await requestSender.getLayer(mockLayerName);
      const notFoundErrorMessage = `Layer name '${mockLayerName}' is not exists`;

      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
      expect(response.body).toEqual({ message: notFoundErrorMessage });
    });
  });

  describe('#addLayer', function () {
    it('Happy Path - should return status 201', async function () {
      const response = await requestSender.addLayer(mockLayerNameIsNotExists);

      expect(response.status).toBe(httpStatusCodes.CREATED);
    });

    it('Bad Path - should fail with response status 400 Bad Request', async function () {
      const mockBadRequestRequest = ({
        // mocking bad request with invalid field 'mockName' to test BadRequest status
        mockName: 'NameIsNotExists',
        tilesPath: '/path/to/s3/directory/tile',
        maxZoomLevel: 18
      } as unknown) as ILayerPostRequest;
      const response = await requestSender.addLayer(mockBadRequestRequest);

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
    });

    it('Sad Path - should fail with response status 409 and layer name is already exists', async function () {
      const response = await requestSender.addLayer(mockLayerNameAlreadyExists);
      const conflictErrorMessage = `Layer name '${mockLayerNameAlreadyExists.name}' is already exists`;

      expect(response.status).toBe(httpStatusCodes.CONFLICT);
      expect(response.body).toEqual({ message: conflictErrorMessage });
    });
  });

  describe('#updateLayer', function () {
    const mockUpdateLayerRequest: ILayerPostRequest = {
      name: 'amsterdam_5cm',
      tilesPath: '/path/to/tiles/directory/in/my/bucket/',
      maxZoomLevel: 18,
      cacheType: 's3',
    };

    it('Happy Path - should return status 202', async function () {
      const response = await requestSender.updateLayer(mockLayerNameAlreadyExists.name, mockUpdateLayerRequest);

      expect(response.status).toBe(httpStatusCodes.ACCEPTED);
    });

    it('Bad Path - should fail with response status 400 Bad Request', async function () {
      const mockBadRequest = ({
        // mocking bad request with invalid field 'mockName' to test BadRequest status
        mockName: 'amsterdam_5cm',
        tilesPath: '/path/to/tiles/directory/in/my/bucket/',
        maxZoomLevel: 18,
      } as unknown) as ILayerPostRequest;

      const response = await requestSender.updateLayer(mockLayerNameAlreadyExists.name, mockBadRequest);

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
    });

    it('Sad Path - should fail with response status 404 Not Found and layer name is not exists', async function () {
      const response = await requestSender.updateLayer(mockLayerNameIsNotExists.name, mockUpdateLayerRequest);
      const notFoundErrorMessage = `Layer name '${mockLayerNameIsNotExists.name}' is not exists`;

      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
      expect(response.body).toEqual({ message: notFoundErrorMessage });
    });
  });

  describe('#removeLayer', function () {
    it('Happy Path - should return status 200', async function () {
      const mockLayerNames = ['mockLayerNameExists', 'NameIsAlreadyExists'];
      const response = await requestSender.removeLayer(mockLayerNames);

      expect(response.status).toBe(httpStatusCodes.OK);
    });
  });

  describe('#addLayerToMosaic', function () {
    const mockMosaicName = 'existsMosaicName';
    const mockLayerToMosaicRequest: ILayerToMosaicRequest = {
      layerName: 'mockLayerNameExists',
    };

    it('Happy Path - should return status 201', async function () {
      const response = await requestSender.addLayerToMosaic(mockMosaicName, mockLayerToMosaicRequest);

      expect(response.status).toBe(httpStatusCodes.CREATED);
    });

    it('Bad Path - should fail with response status 400 Bad Request', async function () {
      const mockMosaicName = 'mosaicMockName';
      // mocking bad request with invalid field 'mockName' to test BadRequest status
      const mockBadRequestRequest = ({
        mockName: 'layerNameIsNotExists',
      } as unknown) as ILayerToMosaicRequest;
      const response = await requestSender.addLayerToMosaic(mockMosaicName, mockBadRequestRequest);

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
    });

    it('Sad Path - should fail with response status 404 Not Found and layer name is not exists', async function () {
      const mockMosaicName = 'existsMosaicName';
      const mockLayerNotExistsRequest: ILayerToMosaicRequest = {
        layerName: 'layerNameIsNotExists',
      };

      const response = await requestSender.addLayerToMosaic(mockMosaicName, mockLayerNotExistsRequest);
      const notFoundErrorMessage = `Layer name '${mockLayerNotExistsRequest.layerName}' is not exists`;

      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
      expect(response.body).toEqual({ message: notFoundErrorMessage });
    });

    // eslint-disable-next-line jest/no-identical-title
    it('Sad Path - should fail with response status 404 Not Found and mosaic name is not exists', async function () {
      const mockMosaicName = 'mosaicMockNameIsNotExists';
      const mockMosaicNotExistsRequest: ILayerToMosaicRequest = {
        layerName: 'mockLayerNameExists',
      };

      const response = await requestSender.addLayerToMosaic(mockMosaicName, mockMosaicNotExistsRequest);
      const notFoundErrorMessage = `Mosaic name '${mockMosaicName}' is not exists`;

      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
      expect(response.body).toEqual({ message: notFoundErrorMessage });
    });
  });

  describe('#updateMosaic', function () {
    const mockMosaicName = 'existsMosaicName';
    const mockUpdateMosaicRequest: IUpdateMosaicRequest = {
      layers: [
        { layerName: 'amsterdam_5cm', zIndex: 1 },
        { layerName: 'NameIsAlreadyExists', zIndex: 0 },
      ],
    };

    it('Happy Path - should return status 201', async function () {
      const response = await requestSender.updateMosaic(mockMosaicName, mockUpdateMosaicRequest);

      expect(response.status).toBe(httpStatusCodes.CREATED);
    });

    it('Bad Path - should fail with response status 400 Bad Request', async function () {
      const mockMosaicName = 'existsMosaicName';
      const mockBadRequest = ({
        // mocking bad request with invalid field 'mockName' to test BadRequest status
        layers: [
          { mockName: 'amsterdam_5cm', zIndex: 1 },
          { mockName: 'LayerNameIsNotExists', zIndex: 0 },
        ],
      } as unknown) as IUpdateMosaicRequest;
      const response = await requestSender.updateMosaic(mockMosaicName, mockBadRequest);

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
    });

    it('Sad Path - should fail with response status 404 Not Found and layer name is not exists', async function () {
      const mockMosaicName = 'existsMosaicName';
      const mockLayerNotExistsRequest: IUpdateMosaicRequest = {
        layers: [
          { layerName: 'amsterdam_5cm', zIndex: 1 },
          { layerName: 'LayerNameIsNotExists', zIndex: 0 },
        ],
      };

      const response = await requestSender.updateMosaic(mockMosaicName, mockLayerNotExistsRequest);
      const notFoundErrorMessage = `Layer name '${mockLayerNotExistsRequest.layers[1].layerName}' is not exists`;

      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
      expect(response.body).toEqual({ message: notFoundErrorMessage });
    });

    // eslint-disable-next-line jest/no-identical-title
    it('Sad Path - should fail with response status 404 Not Found and mosaic name is not exists', async function () {
      const mockMosaicName = 'NotExistsMosaicName';
      const mockMosaicNotExistsRequest: IUpdateMosaicRequest = {
        layers: [
          { layerName: 'amsterdam_5cm', zIndex: 1 },
          { layerName: 'NameIsAlreadyExists', zIndex: 0 },
        ],
      };

      const response = await requestSender.updateMosaic(mockMosaicName, mockMosaicNotExistsRequest);
      const notFoundErrorMessage = `Mosaic name '${mockMosaicName}' is not exists`;

      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
      expect(response.body).toEqual({ message: notFoundErrorMessage });
    });
  });
});
