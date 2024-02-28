/* eslint-disable jest/no-commented-out-tests */
/// <reference types="jest-extended" />
import { normalize } from 'node:path';
import { container } from 'tsyringe';
import jsLogger from '@map-colonies/js-logger';
import { ConflictError, NotFoundError, NotImplementedError } from '@map-colonies/error-types';
import { TileOutputFormat } from '@map-colonies/mc-model-types';
import { lookup as mimeLookup, TilesMimeFormat } from '@map-colonies/types';
import config from 'config';
import { ILayerPostRequest, IMapProxyCache, IMapProxyConfig, IRedisConfig } from '../../../../src/common/interfaces';
import { LayersManager } from '../../../../src/layers/models/layersManager';
import { mockLayerNameAlreadyExists } from '../../mock/mockLayerNameAlreadyExists';
import { mockLayerNameIsNotExists } from '../../mock/mockLayerNameIsNotExists';
import { MockConfigProvider, getJsonMock, updateJsonMock, init as initConfigProvider } from '../../mock/mockConfigProvider';
import { SERVICES } from '../../../../src/common/constants';
import { registerTestValues } from '../../../integration/testContainerConfig';
import { init as initConfig, clear as clearConfig } from '../../../configurations/config';

let layersManager: LayersManager;
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
      const resource: IMapProxyCache = await layersManager.getLayer('mockLayerNameExists');
      // expectation;

      expect(getJsonMock).toHaveBeenCalledTimes(1);
      expect(resource).toStrictEqual(expectedCache);
    });

    it('should successfully return the requested cache', async () => {
      const expectedCache = {
        sources: [],
        grids: ['epsg4326dir'],
        format: 'image/png',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        upscale_tiles: 18,
        cache: {
          type: 's3',
          directory: '/path/to/s3/directory/tile',
          directory_layout: 'tms', // eslint-disable-line @typescript-eslint/naming-convention
        },
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

  describe('#getCacheByNameAndType', () => {
    it('should successfully return the cache name', async () => {
      const expectedCache = {
        cacheName: 'mockLayerNameExists',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        cache: { directory: '/path/to/s3/directory/tile', directory_layout: 'tms', type: 's3' },
      };

      // action
      expect.assertions(2);
      const action = layersManager.getCacheByNameAndType('mockLayerNameExists', 's3');
      // expectation;

      expect(getJsonMock).toHaveBeenCalledTimes(1);
      expect(await action).toStrictEqual(expectedCache);
    });

    it('should fail with not found', async () => {
      // action
      expect.assertions(1);
      const action = layersManager.getCacheByNameAndType('mockLayerNameNotExists', 's3');
      // expectation;
      await expect(action).rejects.toThrow(NotFoundError);
    });

    it('should fail with not found for layer without cache object', async () => {
      // action
      const layerName = 'noCacheForLayer';
      expect.assertions(1);
      const action = layersManager.getCacheByNameAndType(layerName, 's3');
      // expectation;
      await expect(action).rejects.toThrow(new NotFoundError(`cache not found for ${layerName} layer`));
    });
    it('should fail with not valid source type', async () => {
      // action
      expect.assertions(1);
      const action = layersManager.getCacheByNameAndType('mockLayerNameExists', 'notValidType');
      // expectation;
      await expect(action).rejects.toThrow(new NotFoundError(`mockLayerNameExists layer cache not found with requested cache type: notValidType`));
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

    it('should successfully add layer + redis cache', async () => {
      // action
      expect.assertions(6);
      const action = layersManager.addLayer(mockLayerNameIsNotExists);

      // expectation
      await expect(action).toResolve();

      const resultJson = await MockConfigProvider.getJson();
      expect(resultJson.layers).toPartiallyContain({ name: mockLayerNameIsNotExists.name });
      expect(resultJson.layers).toPartiallyContain({ name: mockLayerNameIsNotExists.name, sources: [`${mockLayerNameIsNotExists.name}-redis`] });
      expect(resultJson.caches).toContainKey(`${mockLayerNameIsNotExists.name}-redis`);
      expect(resultJson.caches).toContainKey(mockLayerNameIsNotExists.name);
      expect(updateJsonMock).toHaveBeenCalledTimes(1);
    });

    it('should successfully add layer without redis cache', async () => {
      //config test
      const redisConfigValue = config.get<IRedisConfig>('redisDisabled');
      container.register(SERVICES.REDISCONFIG, { useValue: redisConfigValue });
      const redisConfig = container.resolve<IRedisConfig>(SERVICES.REDISCONFIG);
      const mapproxyConfig = container.resolve<IMapProxyConfig>(SERVICES.MAPPROXY);
      layersManager = new LayersManager(logger, mapproxyConfig, redisConfig, MockConfigProvider);

      // action
      expect.assertions(4);
      const action = layersManager.addLayer(mockLayerNameIsNotExists);

      // expectation
      await expect(action).toResolve();

      const resultJson = await MockConfigProvider.getJson();
      expect(resultJson.layers).toPartiallyContain({ name: mockLayerNameIsNotExists.name, sources: [mockLayerNameIsNotExists.name] });
      expect(resultJson.caches).not.toContainKey(`${mockLayerNameIsNotExists.name}-redis`);
      expect(updateJsonMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('#removeLayer', () => {
    it('should successfully remove layer', async () => {
      // mock
      const mockLayerNames = ['mockLayerNameExists', 'NameIsAlreadyExists'];
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
      expect(data.caches[`${mockLayerNames}-redis`]).toBeDefined();
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      expect(data.caches[`${mockLayerNames}`]).toBeDefined();

      // action
      expect.assertions(6);
      const action = layersManager.removeLayer(mockLayerNames);

      // expectation
      await expect(action).toResolve();

      const resultJson = await MockConfigProvider.getJson();
      expect(resultJson.layers).not.toPartiallyContain({ name: `${mockLayerNameIsNotExists.name}` });
      expect(resultJson.caches).not.toContainKey(mockLayerNameIsNotExists.name);
      expect(resultJson.caches).not.toContainKey(`${mockLayerNameIsNotExists.name}-redis`);
    });

    it('should return not implemented and throw', async () => {
      //check data
      expect.assertions(3);
      const data = await MockConfigProvider.getJson();
      expect(data.caches['mockLayerNameIsNotExists']).toBeUndefined();
      expect(data.caches['anotherMockLayerNameNotExists-redis']).toBeUndefined();

      // mock
      const mockNotExistsLayerNames = ['mockLayerNameIsNotExists-redis', 'anotherMockLayerNameNotExists'];
      // action
      const action = layersManager.removeLayer(mockNotExistsLayerNames);
      // expectation
      await expect(action).rejects.toThrow(Error);
    });

    it('should return the not found layer name', async () => {
      //check data
      expect.assertions(2);
      const data = await MockConfigProvider.getJson();
      expect(data.caches['mockLayerNameIsNotExists']).toBeUndefined();

      // mock
      const mockNotExistsLayerNames = ['anotherMockLayerNameNotExists'];
      // action
      const action = layersManager.removeLayer(mockNotExistsLayerNames);
      // expectation
      expect(await action).toEqual(['anotherMockLayerNameNotExists']);
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
      const mockLayerName = 'mockLayerNameExists';
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
      const mockLayerName = 'redisExists';
      const mockRedisLayerName = 'redisExists-redis';
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

    it('should reject with not implemented error due layer name ends with -redis', async () => {
      // mock
      const mockLayerName = 'mockLayerNameIsNotExists-redis';
      // action
      const action = async () => {
        await layersManager.updateLayer(mockLayerName, mockUpdateLayerRequest);
      };
      // expectation
      await expect(action).rejects.toThrow(NotImplementedError);
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
