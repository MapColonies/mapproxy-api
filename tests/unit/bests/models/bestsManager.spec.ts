import config from 'config';
import { IBestLayer, ILayerToBestRequest, IMapProxyConfig } from '../../../../src/common/interfaces';
import { BestsManager } from '../../../../src/bests/models/bestsManager';
import * as utils from '../../../../src/common/utils';
import { NoContentError } from '../../../../src/common/exceptions/http/noContentError';

let bestsManager: BestsManager;
let convertYamlToJsonstub: jest.SpyInstance;
let convertJsonToYamlStub: jest.SpyInstance;
let replaceYamlContentStub: jest.SpyInstance;
const mapproxyConfig = config.get<IMapProxyConfig>('mapproxy');
describe('bestsManager', () => {
  beforeEach(function () {
    bestsManager = new BestsManager({ log: jest.fn() }, { yamlFilePath: 'tests/unit/mock/mockContent.yaml', cache: mapproxyConfig.cache });
    // stub util functions
    convertYamlToJsonstub = jest.spyOn(utils, 'convertYamlToJson');
    convertJsonToYamlStub = jest.spyOn(utils, 'convertJsonToYaml');
    replaceYamlContentStub = jest.spyOn(utils, 'replaceYamlFileContent').mockReturnValueOnce(undefined);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  describe('#getBest', () => {
    it('should return array of best layers', function () {
      // action
      const resource: IBestLayer = { layers: ['mock', 'mock2', 'mock3'] };
      // expectation
      expect(resource.layers).toBeInstanceOf(Array);
      expect(resource.layers).toContain('mock');
      expect(resource.layers).toContain('mock2');
      expect(resource.layers).toContain('mock3');
    });
  });
  describe('#addLayerToBest', () => {
    it('should reject with no content error due layer name is not exists', function () {
      // mock
      const mockLayerNotExistsToBestRequest: ILayerToBestRequest = {
        layerName: 'layerNameIsNotExists',
        bestName: 'bestMockName',
      };
      // action
      const action = () => bestsManager.addLayerToBest(mockLayerNotExistsToBestRequest);
      // expectation
      expect(action).toThrow(NoContentError);
      expect(convertYamlToJsonstub).toHaveBeenCalledTimes(1);
      expect(convertJsonToYamlStub).not.toHaveBeenCalled();
      expect(replaceYamlContentStub).not.toHaveBeenCalled();
    });
    it('should reject with no content error due best name is not exists', function () {
      // mock
      const mockLayerToBestRequest: ILayerToBestRequest = {
        layerName: 'mockLayerNameExists',
        bestName: 'bestNameIsNotExists',
      };
      // action
      const action = () => bestsManager.addLayerToBest(mockLayerToBestRequest);
      // expectation
      expect(action).toThrow(NoContentError);
      expect(convertYamlToJsonstub).toHaveBeenCalledTimes(1);
      expect(convertJsonToYamlStub).not.toHaveBeenCalled();
      expect(replaceYamlContentStub).not.toHaveBeenCalled();
    });
    it('should successfully add layer to best', function () {
      // mock
      const mockLayerToBestRequest: ILayerToBestRequest = {
        layerName: 'mockLayerNameExists',
        bestName: 'existsBestName',
      };
      // action
      const action = () => bestsManager.addLayerToBest(mockLayerToBestRequest);
      // expectation
      expect(action).not.toThrow();
      expect(convertYamlToJsonstub).toHaveBeenCalledTimes(1);
      expect(convertJsonToYamlStub).toHaveBeenCalledTimes(1);
      expect(replaceYamlContentStub).toHaveBeenCalledTimes(1);
    });
  });
});
