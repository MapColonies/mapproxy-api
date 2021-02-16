import httpStatusCodes from 'http-status-codes';
import { container } from 'tsyringe';
import { ILayerPostRequest, ILayerToMosaicRequest, IMapProxyCache, IUpdateMosaicRequest } from '../../../src/common/interfaces';
import { mockLayerNameIsNotExists } from '../../unit/mock/mockLayerNameIsNotExists';
import { mockLayerNameAlreadyExists } from '../../unit/mock/mockLayerNameAlreadyExists';
import { registerTestValues } from '../testContainerConfig';
import * as utils from '../../../src/common/utils';
import * as requestSender from './helpers/requestSender';

describe('layerManager', function () {
  beforeAll(function () {
    registerTestValues();
    requestSender.init();
  });
  beforeEach(function () {
    jest.spyOn(utils, 'replaceYamlFileContent').mockReturnValueOnce(undefined);
  });
  afterEach(function () {
    jest.clearAllMocks();
    container.clearInstances();
  });

  describe('#getLayer', function () {
    it('Happy Path', async function () {
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

    it('Sad Path', async function () {
      const mockLayerName = 'mockLayerNameIsNotExists';
      const response = await requestSender.getLayer(mockLayerName);
      const notFoundErrorMessage = `Layer name '${mockLayerName}' is not exists`;

      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
      expect(response.body).toEqual({ message: notFoundErrorMessage });
    });
  });

  describe('#addLayer', function () {
    it('Happy Path', async function () {
      const response = await requestSender.addLayer(mockLayerNameIsNotExists);

      expect(response.status).toBe(httpStatusCodes.CREATED);
    });

    it('Bad Path', async function () {
      const mockBadRequestRequest = ({
        mockName: 'NameIsNotExists',
        tilesPath: '/path/to/s3/directory/tile',
        maxZoomLevel: 18,
        description: 'amsterdam 5m layer discription',
      } as unknown) as ILayerPostRequest;
      const response = await requestSender.addLayer(mockBadRequestRequest);

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
    });

    it('Sad Path', async function () {
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
      description: 'description for amsterdam layer',
    };

    it('Happy Path', async function () {
      const response = await requestSender.updateLayer(mockLayerNameAlreadyExists.name, mockUpdateLayerRequest);

      expect(response.status).toBe(httpStatusCodes.ACCEPTED);
    });

    it('Bad Path', async function () {
      const mockBadRequest = ({
        mockName: 'amsterdam_5cm',
        tilesPath: '/path/to/tiles/directory/in/my/bucket/',
        maxZoomLevel: 18,
        description: 'description for amsterdam layer',
      } as unknown) as ILayerPostRequest;

      const response = await requestSender.updateLayer(mockLayerNameAlreadyExists.name, mockBadRequest);

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
    });

    it('Sad Path', async function () {
      const response = await requestSender.updateLayer(mockLayerNameIsNotExists.name, mockUpdateLayerRequest);
      const notFoundErrorMessage = `Layer name '${mockLayerNameIsNotExists.name}' is not exists`;

      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
      expect(response.body).toEqual({ message: notFoundErrorMessage });
    });
  });

  describe('#removeLayer', function () {
    it('Happy Path', async function () {
      const response = await requestSender.removeLayer(mockLayerNameAlreadyExists.name);

      expect(response.status).toBe(httpStatusCodes.ACCEPTED);
    });

    it('Sad Path', async function () {
      const response = await requestSender.removeLayer(mockLayerNameIsNotExists.name);
      const notFoundErrorMessage = `Layer name '${mockLayerNameIsNotExists.name}' is not exists`;

      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
      expect(response.body).toEqual({ message: notFoundErrorMessage });
    });
  });

  describe('#addLayerToMosaic', function () {
    const mockLayerToMosaicRequest: ILayerToMosaicRequest = {
      layerName: 'mockLayerNameExists',
      mosaicName: 'existsMosaicName',
    };

    it('Happy Path', async function () {
      const response = await requestSender.addLayerToMosaic(mockLayerToMosaicRequest);

      expect(response.status).toBe(httpStatusCodes.CREATED);
    });

    it('Bad Path', async function () {
      const mockBadRequestRequest = ({
        name: 'layerNameIsNotExists',
        mosaicName: 'mosaicMockName',
      } as unknown) as ILayerToMosaicRequest;
      const response = await requestSender.addLayerToMosaic(mockBadRequestRequest);

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
    });

    it('Sad Path', async function () {
      const mockLayerNotExistsRequest: ILayerToMosaicRequest = {
        layerName: 'layerNameIsNotExists',
        mosaicName: 'mosaicMockName',
      };

      const response = await requestSender.addLayerToMosaic(mockLayerNotExistsRequest);
      const notFoundErrorMessage = `Layer name '${mockLayerNotExistsRequest.layerName}' is not exists`;

      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
      expect(response.body).toEqual({ message: notFoundErrorMessage });
    });

    // eslint-disable-next-line jest/no-identical-title
    it('Sad Path', async function () {
      const mockMosaicNotExistsRequest: ILayerToMosaicRequest = {
        layerName: 'mockLayerNameExists',
        mosaicName: 'mosaicNameIsNotExists',
      };

      const response = await requestSender.addLayerToMosaic(mockMosaicNotExistsRequest);
      const notFoundErrorMessage = `Mosaic name '${mockMosaicNotExistsRequest.mosaicName}' is not exists`;

      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
      expect(response.body).toEqual({ message: notFoundErrorMessage });
    });
  });

  describe('#updateMosaic', function () {
    const mockUpdateMosaicRequest: IUpdateMosaicRequest = {
      layers: [
        { layerName: 'amsterdam_5cm', zIndex: 1 },
        { layerName: 'NameIsAlreadyExists', zIndex: 0 },
      ],
      mosaicName: 'existsMosaicName',
    };

    it('Happy Path', async function () {
      const response = await requestSender.updateMosaic(mockUpdateMosaicRequest);

      expect(response.status).toBe(httpStatusCodes.CREATED);
    });

    it('Bad Path', async function () {
      const mockBadRequest = ({
        layers: [
          { mockName: 'amsterdam_5cm', zIndex: 1 },
          { mockName: 'LayerNameIsNotExists', zIndex: 0 },
        ],
        mosaicName: 'existsMosaicName',
      } as unknown) as IUpdateMosaicRequest;
      const response = await requestSender.updateMosaic(mockBadRequest);

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
    });

    it('Sad Path', async function () {
      const mockLayerNotExistsRequest: IUpdateMosaicRequest = {
        layers: [
          { layerName: 'amsterdam_5cm', zIndex: 1 },
          { layerName: 'LayerNameIsNotExists', zIndex: 0 },
        ],
        mosaicName: 'existsMosaicName',
      };

      const response = await requestSender.updateMosaic(mockLayerNotExistsRequest);
      const notFoundErrorMessage = `Layer name '${mockLayerNotExistsRequest.layers[1].layerName}' is not exists`;

      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
      expect(response.body).toEqual({ message: notFoundErrorMessage });
    });

    // eslint-disable-next-line jest/no-identical-title
    it('Sad Path', async function () {
      const mockMosaicNotExistsRequest: IUpdateMosaicRequest = {
        layers: [
          { layerName: 'amsterdam_5cm', zIndex: 1 },
          { layerName: 'NameIsAlreadyExists', zIndex: 0 },
        ],
        mosaicName: 'NotExistsMosaicName',
      };

      const response = await requestSender.updateMosaic(mockMosaicNotExistsRequest);
      const notFoundErrorMessage = `Mosaic name '${mockMosaicNotExistsRequest.mosaicName}' is not exists`;

      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
      expect(response.body).toEqual({ message: notFoundErrorMessage });
    });
  });
});
