/// <reference types="jest-extended" />
import { normalize } from 'node:path';
import { container } from 'tsyringe';
import jsLogger from '@map-colonies/js-logger';
import { BadRequestError, ConflictError, NotFoundError } from '@map-colonies/error-types';
import { TileOutputFormat } from '@map-colonies/mc-model-types';
import { lookup as mimeLookup, TilesMimeFormat } from '@map-colonies/types';
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
import { ConfigsManager } from '../../../../src/configs/models/configsManager';
import { mockData , mockFalseData} from '../../mock/mockData';

let layersManager: LayersManager;
let configManager: ConfigsManager;
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
    configManager = new ConfigsManager(logger, mapproxyConfig, MockConfigProvider);
    layersManager = new LayersManager(logger, mapproxyConfig, redisConfig, MockConfigProvider, configManager);
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
      const expectedCache = {
        sources: [],
        grids: ['epsg4326dir'],
        format: 'image/png',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        upscale_tiles: 18,
        cache: {
          type: 's3',
          directory: '/path/to/s3/directory/tile',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          directory_layout: 'tms',
        },
      };

      // action
      expect.assertions(2);
      const resource: IMapProxyCache = await layersManager.getLayer('mockLayerNameExists-source');
      // expectation;

      expect(getJsonMock).toHaveBeenCalledTimes(1);
      expect(resource).toStrictEqual(expectedCache);
    });

    it('should successfully return the requested redis cache', async () => {
      const expectedCache = {
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
        sources: ['redisExists-source'],
        grids: ['epsg4326dir'],
        format: 'image/png',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        upscale_tiles: 18,
      };

      // action
      expect.assertions(2);
      const resource: IMapProxyCache = await layersManager.getLayer('redisExists');

      // expectation;
      expect(getJsonMock).toHaveBeenCalledTimes(1);
      expect(resource).toStrictEqual(expectedCache);
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
      jest.spyOn(configManager,'getConfig').mockResolvedValue(mockData());
      // action
      const action = async () => {
        await layersManager.addLayer(mockLayerNameAlreadyExists);
      };

      // expectation
      await expect(action).rejects.toThrow(ConflictError);
      expect(updateJsonMock).toHaveBeenCalledTimes(1);
    });

    it('should successfully add layer + redis cache', async () => {
      jest.spyOn(configManager,'getConfig').mockResolvedValue(mockData());
      // action
      expect.assertions(5);
      const action = layersManager.addLayer(mockLayerNameIsNotExists);

      // expectation
      await expect(action).toResolve();

      const resultJson = await MockConfigProvider.getJson();
      expect(resultJson.layers).toPartiallyContain({ name: mockLayerNameIsNotExists.name });
      expect(resultJson.caches).toContainKey(`${mockLayerNameIsNotExists.name}-source`);
      expect(resultJson.caches).toContainKey(mockLayerNameIsNotExists.name);
      expect(updateJsonMock).toHaveBeenCalledTimes(1);
    });

    it('should successfully add layer without redis cache', async () => {
      //config test
      const redisConfigValue = config.get<IRedisConfig>('redisDisabled');
      container.register(SERVICES.REDISCONFIG, { useValue: redisConfigValue });
      const redisConfig = container.resolve<IRedisConfig>(SERVICES.REDISCONFIG);
      const mapproxyConfig = container.resolve<IMapProxyConfig>(SERVICES.MAPPROXY);
      configManager = new ConfigsManager(logger, mapproxyConfig, MockConfigProvider);
      layersManager = new LayersManager(logger, mapproxyConfig, redisConfig, MockConfigProvider, configManager);
      jest.spyOn(configManager,'getConfig').mockResolvedValue(mockData());
      // action
      expect.assertions(4);
      const action = layersManager.addLayer(mockLayerNameIsNotExists);

      // expectation
      await expect(action).toResolve();

      const resultJson = await MockConfigProvider.getJson();
      expect(resultJson.layers).toPartiallyContain({ name: mockLayerNameIsNotExists.name, sources: [`${mockLayerNameIsNotExists.name}-source`] });
      expect(resultJson.caches).not.toContainKey(mockLayerNameIsNotExists.name);
      expect(updateJsonMock).toHaveBeenCalledTimes(1);
    });

    it('should reject with bad request error', async () => {
      jest.spyOn(configManager,'getConfig').mockResolvedValue(mockFalseData());
      // action
      const action = async () => {
        await layersManager.addLayer(mockLayerNameAlreadyExists);
      };

      // expectation
      await expect(action).rejects.toThrow(BadRequestError);
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
      const mockLayerNames = ['redisExists'];
      const data = await MockConfigProvider.getJson();
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      expect(data.caches[`${mockLayerNames}`]).toBeDefined();
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      expect(data.caches[`${mockLayerNames}-source`]).toBeDefined();

      // action
      expect.assertions(6);
      const action = layersManager.removeLayer(mockLayerNames);

      // expectation
      await expect(action).toResolve();

      const resultJson = await MockConfigProvider.getJson();
      expect(resultJson.layers).not.toPartiallyContain({ name: `${mockLayerNameIsNotExists.name}` });
      expect(resultJson.caches).not.toContainKey(mockLayerNameIsNotExists.name);
      expect(resultJson.caches).not.toContainKey(`${mockLayerNameIsNotExists.name}-source`);
    });

    it('should return not found layers array and not to throw', async () => {
      //check data
      expect.assertions(5);
      const data = await MockConfigProvider.getJson();
      expect(data.caches['mockLayerNameIsNotExists-source']).toBeUndefined();
      expect(data.caches['anotherMockLayerNameNotExists']).toBeUndefined();

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
      const mockRedisLayerName = 'redisExists';
      const expectedTileMimeFormatPng = mimeLookup(TileOutputFormat.PNG) as TilesMimeFormat;
      const expectedTileMimeFormatJpeg = mimeLookup(TileOutputFormat.JPEG) as TilesMimeFormat;

      //check data
      const data = await MockConfigProvider.getJson();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(data.caches[mockLayerName].format).toBe(expectedTileMimeFormatPng);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(data.caches[mockRedisLayerName].format).toBe(expectedTileMimeFormatPng);

      // action
      const action = layersManager.updateLayer(mockLayerName, mockUpdateLayerRequest);

      // expectation
      expect.assertions(6);
      await expect(action).toResolve();
      const result = await MockConfigProvider.getJson();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(result.caches[mockLayerName].format).toBe(expectedTileMimeFormatJpeg);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(result.caches[mockRedisLayerName].format).toBe(expectedTileMimeFormatJpeg);
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

    it('should throw exception on illegal value', () => {
      const cacheType = 'badProvider';
      // action
      const action = () => layersManager.getCacheType(cacheType, mockTilesPath);
      // expectation
      const msg = `Invalid cache source: ${cacheType} has been provided , available values: "geopackage", "s3", "file", "redis"`;
      expect(action).toThrow(Error(msg));
    });
  });
});
