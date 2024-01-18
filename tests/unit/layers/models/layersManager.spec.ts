import { normalize } from 'node:path';
import { container } from 'tsyringe';
import jsLogger from '@map-colonies/js-logger';
import { ConflictError, NotFoundError } from '@map-colonies/error-types';
import { TileOutputFormat } from '@map-colonies/mc-model-types';
import config from 'config';
import {
  ILayerPostRequest,
  ILayerToMosaicRequest,
  IMapProxyCache,
  IMapProxyConfig,
  IRedisConfig,
  IUpdateMosaicRequest,
} from '../../../../src/common/interfaces';
import { LayersManager } from '../../../../src/layers/models/layersManager';
import { mockLayerNameAlreadyExists } from '../../mock/mockLayerNameAlreadyExists';
import { mockLayerNameIsNotExists } from '../../mock/mockLayerNameIsNotExists';
import * as utils from '../../../../src/common/utils';
import { MockConfigProvider, getJsonMock, updateJsonMock, init as initConfigProvider } from '../../mock/mockConfigProvider';
import { SERVICES } from '../../../../src/common/constants';
import { registerTestValues } from '../../../integration/testContainerConfig';
import { init as initConfig, clear as clearConfig } from '../../../configurations/config';

let layersManager: LayersManager;
let sortArrayByZIndexStub: jest.SpyInstance;
const logger = jsLogger({ enabled: false });

describe('layersManager', () => {
  beforeEach(() => {
    // stub util functions
    initConfig();
    registerTestValues();
    initConfigProvider();
    //defalut layerManger - redis is enabled
    const redisConfig = container.resolve<IRedisConfig>(SERVICES.REDISCONFIG);
    const mapproxyConfig = container.resolve<IMapProxyConfig>(SERVICES.MAPPROXY);
    layersManager = new LayersManager(logger, mapproxyConfig, redisConfig, MockConfigProvider);
    sortArrayByZIndexStub = jest.spyOn(utils, 'sortArrayByZIndex').mockReturnValueOnce(['mockLayer1', 'mockLayer2', 'mockLayer3']);
  });

  afterEach(() => {
    clearConfig();
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

    it('should successfully return the requested redis layer', async () => {
      // action
      const resource: IMapProxyCache = await layersManager.getLayer('redisExists');
      // expectation;
      expect(getJsonMock).toHaveBeenCalledTimes(1);
      expect(resource.sources).toEqual(['redisExists-source']);
      expect(resource.upscale_tiles).toBe(18);
      expect(resource.format).toBe('image/png');
      expect(resource.grids).toEqual(['epsg4326dir']);
      // eslint-disable-next-line @typescript-eslint/naming-convention
      expect(resource.cache).toEqual({
        host: 'raster-mapproxy-redis-master',
        port: 6379,
        username: 'mapcolonies',
        password: 'mapcolonies',
        prefix: 'mcrl:',
        type: 'redis',
        default_ttl: 86400,
      });
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

    it('should successfully add layer without redis cache', async () => {
      //config redis to disable
      const redisConfigValue = config.get<IRedisConfig>('redisDisabled');
      container.register(SERVICES.REDISCONFIG, { useValue: redisConfigValue });
      const redisConfig = container.resolve<IRedisConfig>(SERVICES.REDISCONFIG);
      const mapproxyConfig = container.resolve<IMapProxyConfig>(SERVICES.MAPPROXY);
      layersManager = new LayersManager(logger, mapproxyConfig, redisConfig, MockConfigProvider);

      // action
      const myAddNewRedisLayerToConfig = jest.spyOn(layersManager, 'addNewRedisLayerToConfig');
      const myAddNewSourceLayerToConfig = jest.spyOn(layersManager, 'addNewSourceLayerToConfig');
      const action = async () => {
        await layersManager.addLayer(mockLayerNameIsNotExists);
      };

      // expectation
      await expect(action()).resolves.not.toThrow();
      expect(myAddNewRedisLayerToConfig).toHaveBeenCalledTimes(0);
      expect(myAddNewSourceLayerToConfig).toHaveBeenCalledTimes(1);
    });

    it('should successfully add layer + redis cache', async () => {
      // action
      const myAddNewRedisLayerToConfig = jest.spyOn(layersManager, 'addNewRedisLayerToConfig');
      const action = async () => {
        await layersManager.addLayer(mockLayerNameIsNotExists);
      };

      // expectation
      await expect(action()).resolves.not.toThrow();
      expect(myAddNewRedisLayerToConfig).toHaveBeenCalled();
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

    it('should successfully remove layer + redis attributes', async () => {
      // mock
      const sliceMock = jest.spyOn(Array.prototype, 'findIndex');
      const mockLayerNames = ['redisExists'];
      // action
      const action = async () => {
        await layersManager.removeLayer(mockLayerNames);
      };
      // expectation
      await expect(action()).resolves.not.toThrow();
      expect(sliceMock).toHaveBeenCalledTimes(2);
    });

    it('should return not found layers array and not to throw', async () => {
      // mock
      const mockNotExistsLayerNames = ['mockLayerNameIsNotExists-source', 'anotherMockLayerNameNotExists'];
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

    it('should successfully update layer + redis attributes', async () => {
      // mock
      const mockLayerName = 'redisExists-source';
      const myCreateRedisCache = jest.spyOn(layersManager, 'createRedisCache');
      // action
      const action = async () => {
        await layersManager.updateLayer(mockLayerName, mockUpdateLayerRequest);
      };
      // expectation
      await expect(action()).resolves.not.toThrow();
      expect(updateJsonMock).toHaveBeenCalledTimes(1);
      expect(myCreateRedisCache).toHaveBeenCalled();
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

    it('should throw exception on illegal value', () => {
      const cacheType = 'badProvider';
      // action
      const action = () => layersManager.getCacheType(cacheType, mockTilesPath);
      // expectation
      const msg = `Invalid cache source: ${cacheType} has been provided , available values: "geopackage", "s3", "file"`;
      expect(action).toThrow(Error(msg));
    });
  });
});
