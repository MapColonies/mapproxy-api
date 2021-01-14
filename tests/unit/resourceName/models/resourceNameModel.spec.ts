import config from 'config';
import { IMapProxyConfig } from '../../../../src/common/interfaces';
import { LayersManager } from '../../../../src/resourceName/models/layersManager';

let layersManager: LayersManager;
const mapproxyConfig = config.get<IMapProxyConfig>('mapproxy');
describe('ResourceNameManager', () => {
  beforeEach(function () {
    layersManager = new LayersManager({ log: jest.fn() }, { yamlFilePath: mapproxyConfig.yamlFilePath, cache: mapproxyConfig.cache });
  });
  describe('#getResource', () => {
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
});
