import fs from 'fs';
import config from 'config';
import { container } from 'tsyringe';
import * as utils from '../../src/common/utils';
import { initConfig } from '../../src/initConfig';
import { IMapProxyConfig } from '../../src/common/interfaces';
import { Services } from '../../src/common/constants';

let writeFileSyncSpy: jest.SpyInstance;
let existsSyncSpy: jest.SpyInstance;
let convertJsonToYamlSpy: jest.SpyInstance;
const mapproxyConfig = { ...config.get<IMapProxyConfig>('mapproxy') };

describe('initConfig', () => {
  beforeEach(function () {
    // stub functions
    container.register(Services.MAPPROXY, { useValue: mapproxyConfig });
    container.register(Services.LOGGER, { useValue: { log: jest.fn() } });
    writeFileSyncSpy = jest.spyOn(fs, 'writeFileSync').mockReturnValue(undefined);
    convertJsonToYamlSpy = jest.spyOn(utils, 'convertJsonToYaml');
    existsSyncSpy = jest.spyOn(fs, 'existsSync');
  });
  afterEach(() => {
    container.reset();
    jest.clearAllMocks();
  });
  describe('#convertYamlToJson', () => {
    it('should create default config file if not exists', function () {
      // mock
      existsSyncSpy.mockReturnValue(false);
      mapproxyConfig.yamlFilePath = 'tests/unit/mock/mapproxy.yaml';
      // action
      const action = () => initConfig(mapproxyConfig);
      // expectation
      expect(action).not.toThrow();
      expect(existsSyncSpy).toHaveBeenCalledTimes(1);
      expect(writeFileSyncSpy).toHaveBeenCalledTimes(1);
      expect(convertJsonToYamlSpy).toHaveBeenCalledTimes(1);
    });

    it('should use the existing default config file', function () {
      // mock
      existsSyncSpy.mockReturnValue(true);
      mapproxyConfig.yamlFilePath = 'tests/unit/mock/mockContent.yaml';
      // action
      const action = () => initConfig(mapproxyConfig);
      // expectation
      expect(action).not.toThrow();
      expect(existsSyncSpy).toHaveBeenCalledTimes(1);
      expect(writeFileSyncSpy).toHaveBeenCalledTimes(0);
      expect(convertJsonToYamlSpy).toHaveBeenCalledTimes(0);
    });

    it('should throw an error due to invalid file extension', function () {
      // mock
      existsSyncSpy.mockReturnValue(false);
      mapproxyConfig.yamlFilePath = 'tests/unit/mock/invalidExtension.txt';
      // action
      const action = () => initConfig(mapproxyConfig);
      // expectation
      expect(action).toThrow(Error);
      expect(writeFileSyncSpy).toHaveBeenCalledTimes(0);
      expect(convertJsonToYamlSpy).toHaveBeenCalledTimes(0);
    });

    it('should throw an error due to invalid file path', function () {
      // mock
      existsSyncSpy.mockReturnValue(false);
      mapproxyConfig.yamlFilePath = 'tests/unit/mock/';
      // action
      const action = () => initConfig(mapproxyConfig);
      // expectation
      expect(action).toThrow(Error);
      expect(writeFileSyncSpy).toHaveBeenCalledTimes(0);
      expect(convertJsonToYamlSpy).toHaveBeenCalledTimes(0);
    });
  });
});
