import { readFileSync } from 'fs';
import { container } from 'tsyringe';
import { ILayerPostRequest, ILayerToMosaicRequest, IMapProxyCache, IMapProxyConfig, IUpdateMosaicRequest } from '../../../../src/common/interfaces';
import { LayersManager } from '../../../../src/layers/models/layersManager';
import { ConfilctError } from '../../../../src/common/exceptions/http/confilctError';
import { mockLayerNameAlreadyExists } from '../../mock/mockLayerNameAlreadyExists';
import { mockLayerNameIsNotExists } from '../../mock/mockLayerNameIsNotExists';
import * as utils from '../../../../src/common/utils';
import { NotFoundError } from '../../../../src/common/exceptions/http/notFoundError';
import { MockConfigProvider } from '../../mock/mockConfigProvider';
import { SERVICES } from '../../../../src/common/constants';
import { registerTestValues } from '../../../integration/testContainerConfig';
import jsLogger from '@map-colonies/js-logger';

let layersManager: LayersManager;
let sortArrayByZIndexStub: jest.SpyInstance;
let getJsonStub: jest.SpyInstance;
let updateJsonStub: jest.SpyInstance;
let mockJsonData: string;
const logger = jsLogger({ enabled: false });

describe('layersManager', () => {
  beforeAll(function () {
    mockJsonData = readFileSync('tests/unit/mock/mockJson.json', 'utf8');
  });

  beforeEach(function () {
    // stub util functions
    registerTestValues();
    const mapproxyConfig = container.resolve<IMapProxyConfig>(SERVICES.MAPPROXY);
    layersManager = new LayersManager(logger, mapproxyConfig, MockConfigProvider.prototype);
    getJsonStub = jest.spyOn(MockConfigProvider.prototype, 'getJson').mockResolvedValue(JSON.parse(mockJsonData));
    updateJsonStub = jest.spyOn(MockConfigProvider.prototype, 'updateJson').mockResolvedValue(undefined);
    sortArrayByZIndexStub = jest.spyOn(utils, 'sortArrayByZIndex').mockReturnValueOnce(['mockLayer1', 'mockLayer2', 'mockLayer3']);
  });

  afterEach(() => {
    container.reset();
    container.clearInstances();
    jest.clearAllMocks();
  });

  describe('#getLayer', () => {
    it('should successfully return the requested layer', async function () {
      // action
      const resource: IMapProxyCache = await layersManager.getLayer('mockLayerNameExists');
      // expectation;
      expect(getJsonStub).toHaveBeenCalledTimes(1);
      expect(resource.sources).toEqual([]);
      expect(resource.upscale_tiles).toEqual(18);
      expect(resource.request_format).toEqual('image/png');
      expect(resource.grids).toEqual(['epsg4326dir']);
      // eslint-disable-next-line @typescript-eslint/naming-convention
      expect(resource.cache).toEqual({ directory: '/path/to/s3/directory/tile', directory_layout: 'tms', type: 's3' });
    });

    it('should reject with not found error', async function () {
      // action
      const action = async () => {
        await layersManager.getLayer('mockLayerNameIsNotExists');
      };
      // expectation;
      await expect(action).rejects.toThrow(NotFoundError);
      expect(getJsonStub).toHaveBeenCalledTimes(1);
      expect(updateJsonStub).not.toHaveBeenCalled();
    });
  });

  describe('#addLayer', () => {
    it('should reject with conflict error', async function () {
      // action
      const action = async () => {
        await layersManager.addLayer(mockLayerNameAlreadyExists);
      };

      // expectation
      await expect(action).rejects.toThrow(ConfilctError);
      expect(getJsonStub).toHaveBeenCalledTimes(1);
      expect(updateJsonStub).not.toHaveBeenCalled();
    });

    it('should successfully add layer', async function () {
      // action
      const action = async () => {
        await layersManager.addLayer(mockLayerNameIsNotExists);
      };

      // expectation
      await expect(action()).resolves.not.toThrow();
      expect(getJsonStub).toHaveBeenCalledTimes(1);
      expect(updateJsonStub).toHaveBeenCalledTimes(1);
    });
  });

  describe('#addLayerToMosaic', () => {
    it('should reject with not found error due layer name is not exists', async function () {
      // mock
      const mockMosaicName = 'mosaicMockName';
      const mockLayerNotExistsToMosaicRequest: ILayerToMosaicRequest = {
        layerName: 'layerNameIsNotExists',
      };
      // action
      const action = async () => {
        await layersManager.addLayerToMosaic(mockMosaicName, mockLayerNotExistsToMosaicRequest);
      };
      // expectation
      await expect(action).rejects.toThrow(NotFoundError);
      expect(getJsonStub).toHaveBeenCalledTimes(1);
      expect(updateJsonStub).not.toHaveBeenCalled();
    });

    it('should reject with not found error due mosaic name is not exists', async function () {
      // mock
      const mockMosaicName = 'mosaicNameIsNotExists';
      const mockLayerToMosaicRequest: ILayerToMosaicRequest = {
        layerName: 'mockLayerNameExists',
      };
      // action
      const action = async () => {
        await layersManager.addLayerToMosaic(mockMosaicName, mockLayerToMosaicRequest);
      };
      // expectation
      await expect(action).rejects.toThrow(NotFoundError);
      expect(getJsonStub).toHaveBeenCalledTimes(1);
      expect(updateJsonStub).not.toHaveBeenCalled();
    });

    it('should successfully add layer to mosaic', async function () {
      // mock
      const mockMosaicName = 'existsMosaicName';
      const mockLayerToMosaicRequest: ILayerToMosaicRequest = {
        layerName: 'mockLayerNameExists',
      };
      // action
      const action = async () => {
        await layersManager.addLayerToMosaic(mockMosaicName, mockLayerToMosaicRequest);
      };
      // expectation
      await expect(action()).resolves.not.toThrow();
      expect(getJsonStub).toHaveBeenCalledTimes(1);
      expect(updateJsonStub).toHaveBeenCalledTimes(1);
    });
  });

  describe('#updateMosaic', () => {
    it('should successfully update mosaic layers by thier z-index', async function () {
      // mock
      const mockMosaicName = 'existsMosaicName';
      const mockUpdateMosaicRequest: IUpdateMosaicRequest = {
        layers: [
          { layerName: 'amsterdam_5cm', zIndex: 1 },
          { layerName: 'NameIsAlreadyExists', zIndex: 0 },
        ],
      };
      // action
      const action = async () => {
        await layersManager.updateMosaic(mockMosaicName, mockUpdateMosaicRequest);
      };
      // expectation
      await expect(action()).resolves.not.toThrow();
      expect(getJsonStub).toHaveBeenCalledTimes(1);
      expect(sortArrayByZIndexStub).toHaveBeenCalledTimes(1);
      expect(updateJsonStub).toHaveBeenCalledTimes(1);
    });

    it('should reject with not found error due layer name is not exists', async function () {
      // mock
      const mockMosaicName = 'existsMosaicName';
      const mockUpdateMosaicRequest: IUpdateMosaicRequest = {
        layers: [
          { layerName: 'amsterdam_5cm', zIndex: 1 },
          { layerName: 'LayerNameIsNotExists', zIndex: 0 },
        ],
      };
      // action
      const action = async () => {
        await layersManager.updateMosaic(mockMosaicName, mockUpdateMosaicRequest);
      };
      // expectation
      await expect(action).rejects.toThrow(NotFoundError);
      expect(getJsonStub).toHaveBeenCalledTimes(1);
      expect(sortArrayByZIndexStub).toHaveBeenCalledTimes(0);
      expect(updateJsonStub).not.toHaveBeenCalled();
    });

    it('should reject with not found error due mosaic name is not exists', async function () {
      // mock
      const mockMosaicName = 'NotExistsMosaicName';
      const mockUpdateMosaicRequest: IUpdateMosaicRequest = {
        layers: [
          { layerName: 'amsterdam_5cm', zIndex: 1 },
          { layerName: 'NameIsAlreadyExists', zIndex: 0 },
        ],
      };
      // action
      const action = async () => {
        await layersManager.updateMosaic(mockMosaicName, mockUpdateMosaicRequest);
      };
      // expectation
      await expect(action).rejects.toThrow(NotFoundError);
      expect(getJsonStub).toHaveBeenCalledTimes(1);
      expect(sortArrayByZIndexStub).toHaveBeenCalledTimes(0);
      expect(updateJsonStub).not.toHaveBeenCalled();
    });
  });

  describe('#removeLayer', () => {
    it('should successfully remove layer', async function () {
      // mock
      const mockLayerNames = ['mockLayerNameExists', 'NameIsAlreadyExists'];
      // action
      const action = async () => {
        await layersManager.removeLayer(mockLayerNames);
      };
      // expectation
      await expect(action()).resolves.not.toThrow();
      expect(getJsonStub).toHaveBeenCalledTimes(1);
      expect(updateJsonStub).toHaveBeenCalledTimes(1);
    });

    it('should return not found layers array and not to throw', async function () {
      // mock
      const mockNotExistsLayerNames = ['mockLayerNameIsNotExists', 'anotherMockLayerNameNotExists'];
      // action
      const result = await layersManager.removeLayer(mockNotExistsLayerNames);
      // expectation
      //await expect(action).rejects.toThrow(NotFoundError);
      expect(result).toEqual(expect.any(Array));
      expect(result).toEqual(mockNotExistsLayerNames);
      expect(getJsonStub).toHaveBeenCalledTimes(1);
      expect(updateJsonStub).not.toHaveBeenCalled();
    });
  });

  describe('#updateLayer', () => {
    const mockUpdateLayerRequest: ILayerPostRequest = {
      name: 'amsterdam_5cm',
      tilesPath: '/path/to/tiles/directory/in/my/bucket/',
      maxZoomLevel: 18,
      cacheType: 's3',
    };

    it('should successfully update layer', async function () {
      // mock
      const mockLayerName = 'mockLayerNameExists';
      // action
      const action = async () => {
        await layersManager.updateLayer(mockLayerName, mockUpdateLayerRequest);
      };
      // expectation
      await expect(action()).resolves.not.toThrow();
      expect(getJsonStub).toHaveBeenCalledTimes(1);
      expect(updateJsonStub).toHaveBeenCalledTimes(1);
    });

    it('should reject with not found error due layer name is not exists', async function () {
      // mock
      const mockLayerName = 'mockLayerNameIsNotExists';
      // action
      const action = async () => {
        await layersManager.updateLayer(mockLayerName, mockUpdateLayerRequest);
      };
      // expectation
      await expect(action).rejects.toThrow(NotFoundError);
      expect(getJsonStub).toHaveBeenCalledTimes(1);
      expect(updateJsonStub).not.toHaveBeenCalled();
    });
  });

  describe('#getCacheType', () => {
    const mockTilesPath = '/mock/tiles/path/';
    const directoryLayout = 'tms';

    it('should provide s3 cache as source', function () {
      const cacheType = 's3';
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const expectedResult = { type: cacheType, directory: mockTilesPath, directory_layout: directoryLayout };
      // mock
      jest.mock('../../../../src/common/cacheProviders/S3Source');
      // action
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const cacheProvider = layersManager.getCacheType(cacheType, mockTilesPath);
      // expectation
      expect(cacheProvider).toEqual(expectedResult);
    });

    it('should provide geopackage cache as source', function () {
      const cacheType = 'geopackage';
      const mockGpkgPath = '/gpkg/path/mock.gpkg';
      const tableName = 'mock';
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const expectedResult = { type: cacheType, filename: mockGpkgPath, table_name: tableName };
      // mock
      jest.mock('../../../../src/common/cacheProviders/gpkgSource');
      // action
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const cacheProvider = layersManager.getCacheType(cacheType, mockGpkgPath);
      // expectation
      expect(cacheProvider).toEqual(expectedResult);
    });

    it('should provide fs cache directory as source', function () {
      const cacheType = 'file';
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const expectedResult = { type: cacheType, directory: mockTilesPath, directory_layout: directoryLayout };
      // mock
      jest.mock('../../../../src/common/cacheProviders/fsSource');
      // action
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const cacheProvider = layersManager.getCacheType(cacheType, mockTilesPath);
      // expectation
      expect(cacheProvider).toEqual(expectedResult);
    });
  });
});
