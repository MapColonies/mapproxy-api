import { normalize } from 'path';
import { container } from 'tsyringe';
import jsLogger from '@map-colonies/js-logger';
import { ConflictError, NotFoundError } from '@map-colonies/error-types';
import { TileOutputFormat } from '@map-colonies/mc-model-types';
import { ILayerPostRequest, ILayerToMosaicRequest, IMapProxyCache, IMapProxyConfig, IUpdateMosaicRequest } from '../../../../src/common/interfaces';
import { LayersManager } from '../../../../src/layers/models/layersManager';
import { mockLayerNameAlreadyExists } from '../../mock/mockLayerNameAlreadyExists';
import { mockLayerNameIsNotExists } from '../../mock/mockLayerNameIsNotExists';
import * as utils from '../../../../src/common/utils';
import { MockConfigProvider, getJsonMock, updateJsonMock, init as initConfigProvider } from '../../mock/mockConfigProvider';
import { SERVICES } from '../../../../src/common/constants';
import { registerTestValues } from '../../../integration/testContainerConfig';

let layersManager: LayersManager;
let sortArrayByZIndexStub: jest.SpyInstance;
const logger = jsLogger({ enabled: false });

describe('layersManager', () => {
  beforeEach(() => {
    // stub util functions
    registerTestValues();
    initConfigProvider();
    const mapproxyConfig = container.resolve<IMapProxyConfig>(SERVICES.MAPPROXY);
    layersManager = new LayersManager(logger, mapproxyConfig, MockConfigProvider);
    sortArrayByZIndexStub = jest.spyOn(utils, 'sortArrayByZIndex').mockReturnValueOnce(['mockLayer1', 'mockLayer2', 'mockLayer3']);
  });

  afterEach(() => {
    container.reset();
    container.clearInstances();
    jest.clearAllMocks();
  });

  describe('#getLayer', () => {
    it('should successfully return the requested layer', async () => {
      // action
      const resource: IMapProxyCache = await layersManager.getLayer('mockLayerNameExists-source');
      // expectation;
      expect(getJsonMock).toHaveBeenCalledTimes(1);
      expect(resource.sources).toEqual([]);
      expect(resource.upscale_tiles).toBe(18);
      expect(resource.format).toBe('image/png');
      expect(resource.grids).toEqual(['epsg4326dir']);
      // eslint-disable-next-line @typescript-eslint/naming-convention
      expect(resource.cache).toEqual({ directory: '/path/to/s3/directory/tile', directory_layout: 'tms', type: 's3' });
    });

    it('should reject with not found error', async () => {
      // action
      const action = async () => {
        await layersManager.getLayer('mockLayerNameIsNotExists');
      };
      // expectation;
      await expect(action).rejects.toThrow(NotFoundError);
      expect(getJsonMock).toHaveBeenCalledTimes(1);
      expect(updateJsonMock).not.toHaveBeenCalled();
    });
  });

  describe('#addLayer', () => {
    it('should reject with conflict error', async () => {
      // action
      const action = async () => {
        await layersManager.addLayer(mockLayerNameAlreadyExists);
      };

      // expectation
      await expect(action).rejects.toThrow(ConflictError);
      expect(updateJsonMock).toHaveBeenCalledTimes(1);
    });

    it('should successfully add layer', async () => {
      // action
      const action = async () => {
        await layersManager.addLayer(mockLayerNameIsNotExists);
      };

      // expectation
      await expect(action()).resolves.not.toThrow();
      expect(updateJsonMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('#addLayerToMosaic', () => {
    it('should reject with not found error due layer name is not exists', async () => {
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
      expect(updateJsonMock).toHaveBeenCalledTimes(1);
    });

    it('should reject with not found error due mosaic name is not exists', async () => {
      // mock
      const mockMosaicName = 'mosaicNameIsNotExists';
      const mockLayerToMosaicRequest: ILayerToMosaicRequest = {
        layerName: 'mockLayerNameExists-source',
      };
      // action
      const action = async () => {
        await layersManager.addLayerToMosaic(mockMosaicName, mockLayerToMosaicRequest);
      };
      // expectation
      await expect(action).rejects.toThrow(NotFoundError);
      expect(updateJsonMock).toHaveBeenCalledTimes(1);
    });

    it('should successfully add layer to mosaic', async () => {
      // mock
      const mockMosaicName = 'existsMosaicName';
      const mockLayerToMosaicRequest: ILayerToMosaicRequest = {
        layerName: 'mockLayerNameExists-source',
      };
      // action
      const action = async () => {
        await layersManager.addLayerToMosaic(mockMosaicName, mockLayerToMosaicRequest);
      };
      // expectation
      await expect(action()).resolves.not.toThrow();
      expect(updateJsonMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('#updateMosaic', () => {
    it('should successfully update mosaic layers by their z-index', async () => {
      // mock
      const mockMosaicName = 'existsMosaicName';
      const mockUpdateMosaicRequest: IUpdateMosaicRequest = {
        layers: [
          { layerName: 'amsterdam_5cm-source', zIndex: 1 },
          { layerName: 'NameIsAlreadyExists-source', zIndex: 0 },
        ],
      };
      // action
      const action = async () => {
        await layersManager.updateMosaic(mockMosaicName, mockUpdateMosaicRequest);
      };
      // expectation
      await expect(action()).resolves.not.toThrow();
      expect(sortArrayByZIndexStub).toHaveBeenCalledTimes(1);
      expect(updateJsonMock).toHaveBeenCalledTimes(1);
    });

    it('should reject with not found error due layer name is not exists', async () => {
      // mock
      const mockMosaicName = 'existsMosaicName';
      const mockUpdateMosaicRequest: IUpdateMosaicRequest = {
        layers: [
          { layerName: 'amsterdam_5cm-source', zIndex: 1 },
          { layerName: 'LayerNameIsNotExists', zIndex: 0 },
        ],
      };
      // action
      const action = async () => {
        await layersManager.updateMosaic(mockMosaicName, mockUpdateMosaicRequest);
      };
      // expectation
      await expect(action).rejects.toThrow(NotFoundError);
      expect(sortArrayByZIndexStub).toHaveBeenCalledTimes(0);
      expect(updateJsonMock).toHaveBeenCalledTimes(1);
    });

    it('should reject with not found error due mosaic name is not exists', async () => {
      // mock
      const mockMosaicName = 'NotExistsMosaicName';
      const mockUpdateMosaicRequest: IUpdateMosaicRequest = {
        layers: [
          { layerName: 'amsterdam_5cm-source', zIndex: 1 },
          { layerName: 'NameIsAlreadyExists-source', zIndex: 0 },
        ],
      };
      // action
      const action = async () => {
        await layersManager.updateMosaic(mockMosaicName, mockUpdateMosaicRequest);
      };
      // expectation
      await expect(action).rejects.toThrow(NotFoundError);
      expect(sortArrayByZIndexStub).toHaveBeenCalledTimes(0);
      expect(updateJsonMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('#removeLayer', () => {
    it('should successfully remove layer', async () => {
      // mock
      const mockLayerNames = ['mockLayerNameExists-source', 'NameIsAlreadyExists-source'];
      // action
      const action = async () => {
        await layersManager.removeLayer(mockLayerNames);
      };
      // expectation
      await expect(action()).resolves.not.toThrow();
      expect(updateJsonMock).toHaveBeenCalledTimes(1);
    });

    it('should return not found layers array and not to throw', async () => {
      // mock
      const mockNotExistsLayerNames = ['mockLayerNameIsNotExists', 'anotherMockLayerNameNotExists'];
      // action
      const result = await layersManager.removeLayer(mockNotExistsLayerNames);
      // expectation
      expect(result).toEqual(expect.any(Array));
      expect(result).toEqual(mockNotExistsLayerNames);
      expect(updateJsonMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('#updateLayer', () => {
    const mockUpdateLayerRequest: ILayerPostRequest = {
      name: 'amsterdam_5cm-source',
      tilesPath: '/path/to/tiles/directory/in/my/bucket/',
      cacheType: 's3',
      format: TileOutputFormat.JPEG,
    };

    it('should successfully update layer', async () => {
      // mock
      const mockLayerName = 'mockLayerNameExists-source';
      // action
      const action = async () => {
        await layersManager.updateLayer(mockLayerName, mockUpdateLayerRequest);
      };
      // expectation
      await expect(action()).resolves.not.toThrow();
      expect(updateJsonMock).toHaveBeenCalledTimes(1);
    });

    it('should reject with not found error due layer name is not exists', async () => {
      // mock
      const mockLayerName = 'mockLayerNameIsNotExists';
      // action
      const action = async () => {
        await layersManager.updateLayer(mockLayerName, mockUpdateLayerRequest);
      };
      // expectation
      await expect(action).rejects.toThrow(NotFoundError);
    });
  });

  describe('#getCacheType', () => {
    const mockTilesPath = '/mock/tiles/path/';
    const directoryLayout = 'tms';

    it('should provide s3 cache as source', () => {
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

    it('should provide geopackage cache as source', () => {
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

    it('should provide fs cache directory as source', () => {
      const cacheType = 'file';
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const expectedResult = { type: cacheType, directory: normalize(mockTilesPath), directory_layout: directoryLayout };
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
