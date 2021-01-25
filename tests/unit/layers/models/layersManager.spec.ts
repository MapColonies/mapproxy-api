import config from 'config';
import { ILayerToBestRequest, IMapProxyConfig } from '../../../../src/common/interfaces';
import { LayersManager } from '../../../../src/layers/models/layersManager';
import { ConfilctError } from '../../../../src/common/exceptions/http/confilctError';
import { mockLayerNameAlreadyExists } from '../../mock/mockLayerNameAlreadyExists';
import { mockLayerNameIsNotExists } from '../../mock/mockLayerNameIsNotExists';
import * as utils from '../../../../src/common/utils';
import { NoContentError } from '../../../../src/common/exceptions/http/noContentError';

let layersManager: LayersManager;
let convertYamlToJsonstub: jest.SpyInstance;
let convertJsonToYamlStub: jest.SpyInstance;
let replaceYamlContentStub: jest.SpyInstance;
const mapproxyConfig = config.get<IMapProxyConfig>('mapproxy');
describe('layersManager', () => {
  beforeEach(function () {
    layersManager = new LayersManager({ log: jest.fn() }, { yamlFilePath: 'tests/unit/mock/mockContent.yaml', cache: mapproxyConfig.cache });
    // stub util functions
    convertYamlToJsonstub = jest.spyOn(utils, 'convertYamlToJson');
    convertJsonToYamlStub = jest.spyOn(utils, 'convertJsonToYaml');
    replaceYamlContentStub = jest.spyOn(utils, 'replaceYamlFileContent').mockReturnValueOnce(undefined);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  describe('#getLayer', () => {
    it('return the layer of id 1', function () {
      // action
      const resource = layersManager.getLayer();
      // expectation
      expect(resource.id).toEqual(1);
      expect(resource.name).toEqual('amsterdam_5cm');
      expect(resource.maxZoomLevel).toEqual(18);
      expect(resource.tilesPath).toEqual('/path/to/s3/directory/tile');
      expect(resource.description).toEqual('amsterdam 5m layer discription');
    });
  });
  describe('#addLayer', () => {
    it('should reject with conflict error', function () {
      // action
      const action = () => layersManager.addLayer(mockLayerNameAlreadyExists);
      // expectation
      expect(action).toThrow(ConfilctError);
      expect(convertYamlToJsonstub).toHaveBeenCalledTimes(1);
      expect(convertJsonToYamlStub).not.toHaveBeenCalled();
      expect(replaceYamlContentStub).not.toHaveBeenCalled();
    });
    it('should successfully add layer', function () {
      // action
      const action = () => layersManager.addLayer(mockLayerNameIsNotExists);
      // expectation
      expect(action).not.toThrow();
      expect(convertYamlToJsonstub).toHaveBeenCalledTimes(1);
      expect(convertJsonToYamlStub).toHaveBeenCalledTimes(1);
      expect(replaceYamlContentStub).toHaveBeenCalledTimes(1);
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
      const action = () => layersManager.addLayerToBest(mockLayerNotExistsToBestRequest);
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
      const action = () => layersManager.addLayerToBest(mockLayerToBestRequest);
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
      const action = () => layersManager.addLayerToBest(mockLayerToBestRequest);
      // expectation
      expect(action).not.toThrow();
      expect(convertYamlToJsonstub).toHaveBeenCalledTimes(1);
      expect(convertJsonToYamlStub).toHaveBeenCalledTimes(1);
      expect(replaceYamlContentStub).toHaveBeenCalledTimes(1);
    });
  });
});
