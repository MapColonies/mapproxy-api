import config from 'config';
import { mockLayer } from '../../../../src/common/data/mock/mockLayer';
import { IMapProxyConfig, IMapProxyJsonDocument } from '../../../../src/common/interfaces';
import { LayersManager } from '../../../../src/layers/models/layersManager';
import { convertJsonToYaml, convertYamlToJson, replaceYamlFileContent } from '../../../../src/common/utils';
import { BadRequestError } from '../../../../src/common/exceptions/http/badRequestError';
import { ConfilctError } from '../../../../src/common/exceptions/http/confilctError';

let layersManager: LayersManager;
let jsonDocument: IMapProxyJsonDocument;
const yamlFilePath = '/home/shlomikoncha/Desktop/Repos/mapproxy-api/tests/unit/mock/mockContent.yaml';

const mapproxyConfig = config.get<IMapProxyConfig>('mapproxy');
describe('layersManager', () => {
  beforeEach(function () {
    layersManager = new LayersManager({ log: jest.fn() }, { yamlFilePath: yamlFilePath, cache: mapproxyConfig.cache });
    jsonDocument = convertYamlToJson(yamlFilePath);
  });
  describe('#getLayer', () => {
    it('return the resource of id 1', function () {
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
      // mock
      layersManager.isLayerNameExists = jest.fn().mockReturnValue(true);
      // action
      const action = () => layersManager.addLayer(mockLayer);
      // expectation
      expect(action).toThrow(ConfilctError);
    });
    it('should successfully add layer', function () {
      // mock
      const isLayerNameExistsSpy = jest.spyOn(layersManager, 'isLayerNameExists');
      layersManager.isLayerNameExists = jest.fn().mockReturnValue(false);
      // action
      const action = () => layersManager.addLayer(mockLayer);
      // expectation
      expect(action).not.toThrow();
    });
  });
});
