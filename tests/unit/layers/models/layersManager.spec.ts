import config from 'config';
import { ILayerPostRequest, ILayerToMosaicRequest, IMapProxyCache, IMapProxyConfig, IUpdateMosaicRequest } from '../../../../src/common/interfaces';
import { LayersManager } from '../../../../src/layers/models/layersManager';
import { ConfilctError } from '../../../../src/common/exceptions/http/confilctError';
import { mockLayerNameAlreadyExists } from '../../mock/mockLayerNameAlreadyExists';
import { mockLayerNameIsNotExists } from '../../mock/mockLayerNameIsNotExists';
import * as utils from '../../../../src/common/utils';
import { NotFoundError } from '../../../../src/common/exceptions/http/notFoundError';

let layersManager: LayersManager;
let convertYamlToJsonStub: jest.SpyInstance;
let convertJsonToYamlStub: jest.SpyInstance;
let replaceYamlContentStub: jest.SpyInstance;
let sortArrayByZIndexStub: jest.SpyInstance;
const mapproxyConfig = config.get<IMapProxyConfig>('mapproxy');
describe('layersManager', () => {
  beforeEach(function () {
    layersManager = new LayersManager({ log: jest.fn() }, { yamlFilePath: 'tests/unit/mock/mockContent.yaml', cache: mapproxyConfig.cache });
    // stub util functions
    convertYamlToJsonStub = jest.spyOn(utils, 'convertYamlToJson');
    convertJsonToYamlStub = jest.spyOn(utils, 'convertJsonToYaml');
    replaceYamlContentStub = jest.spyOn(utils, 'replaceYamlFileContent').mockReturnValueOnce(undefined);
    sortArrayByZIndexStub = jest.spyOn(utils, 'sortArrayByZIndex').mockReturnValueOnce(['mockLayer1', 'mockLayer2', 'mockLayer3']);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('#getLayer', () => {
    it('should successfully return the requested layer', function () {
      // action
      const resource: IMapProxyCache = layersManager.getLayer('mockLayerNameExists');
      // expectation;
      expect(resource.sources).toEqual([]);
      expect(resource.upscale_tiles).toEqual(18);
      expect(resource.request_format).toEqual('image/png');
      expect(resource.grids).toEqual(['epsg4326dir']);
      // eslint-disable-next-line @typescript-eslint/naming-convention
      expect(resource.cache).toEqual({ directory: '/path/to/s3/directory/tile', directory_layout: 'tms', type: 's3' });
    });

    it('should reject with not found error', function () {
      // action
      const action = () => layersManager.getLayer('mockLayerNameIsNotExists');
      // expectation;
      expect(action).toThrow(NotFoundError);
    });
  });

  describe('#addLayer', () => {
    it('should reject with conflict error', function () {
      // action
      const action = () => layersManager.addLayer(mockLayerNameAlreadyExists);
      // expectation
      expect(action).toThrow(ConfilctError);
      expect(convertYamlToJsonStub).toHaveBeenCalledTimes(1);
      expect(convertJsonToYamlStub).not.toHaveBeenCalled();
      expect(replaceYamlContentStub).not.toHaveBeenCalled();
    });

    it('should successfully add layer', function () {
      // action
      const action = () => layersManager.addLayer(mockLayerNameIsNotExists);
      // expectation
      expect(action).not.toThrow();
      expect(convertYamlToJsonStub).toHaveBeenCalledTimes(1);
      expect(convertJsonToYamlStub).toHaveBeenCalledTimes(1);
      expect(replaceYamlContentStub).toHaveBeenCalledTimes(1);
    });
  });

  describe('#addLayerToMosaic', () => {
    it('should reject with not found error due layer name is not exists', function () {
      // mock
      const mockMosaicName = 'mosaicMockName'
      const mockLayerNotExistsToMosaicRequest: ILayerToMosaicRequest = {
        layerName: 'layerNameIsNotExists',
      };
      // action
      const action = () => layersManager.addLayerToMosaic(mockMosaicName, mockLayerNotExistsToMosaicRequest);
      // expectation
      expect(action).toThrow(NotFoundError);
      expect(convertYamlToJsonStub).toHaveBeenCalledTimes(1);
      expect(convertJsonToYamlStub).not.toHaveBeenCalled();
      expect(replaceYamlContentStub).not.toHaveBeenCalled();
    });

    it('should reject with not found error due mosaic name is not exists', function () {
      // mock
      const mockMosaicName = 'mosaicNameIsNotExists';
      const mockLayerToMosaicRequest: ILayerToMosaicRequest = {
        layerName: 'mockLayerNameExists',
      };
      // action
      const action = () => layersManager.addLayerToMosaic(mockMosaicName, mockLayerToMosaicRequest);
      // expectation
      expect(action).toThrow(NotFoundError);
      expect(convertYamlToJsonStub).toHaveBeenCalledTimes(1);
      expect(convertJsonToYamlStub).not.toHaveBeenCalled();
      expect(replaceYamlContentStub).not.toHaveBeenCalled();
    });

    it('should successfully add layer to mosaic', function () {
      // mock
      const mockMosaicName = 'existsMosaicName';
      const mockLayerToMosaicRequest: ILayerToMosaicRequest = {
        layerName: 'mockLayerNameExists',
      };
      // action
      const action = () => layersManager.addLayerToMosaic(mockMosaicName, mockLayerToMosaicRequest);
      // expectation
      expect(action).not.toThrow();
      expect(convertYamlToJsonStub).toHaveBeenCalledTimes(1);
      expect(convertJsonToYamlStub).toHaveBeenCalledTimes(1);
      expect(replaceYamlContentStub).toHaveBeenCalledTimes(1);
    });
  });
  describe('#updateMosaic', () => {
    it('should successfully update mosaic layers by thier z-index', function () {
      // mock
      const mockMosaicName = 'existsMosaicName';
      const mockUpdateMosaicRequest: IUpdateMosaicRequest = {
        layers: [
          { layerName: 'amsterdam_5cm', zIndex: 1 },
          { layerName: 'NameIsAlreadyExists', zIndex: 0 },
        ],
      };
      // action
      const action = () => layersManager.updateMosaic(mockMosaicName, mockUpdateMosaicRequest);
      // expectation
      expect(action).not.toThrow();
      expect(convertYamlToJsonStub).toHaveBeenCalledTimes(1);
      expect(sortArrayByZIndexStub).toHaveBeenCalledTimes(1);
      expect(convertJsonToYamlStub).toHaveBeenCalledTimes(1);
      expect(replaceYamlContentStub).toHaveBeenCalledTimes(1);
    });

    it('should reject with not found error due layer name is not exists', function () {
      // mock
      const mockMosaicName = 'existsMosaicName';
      const mockUpdateMosaicRequest: IUpdateMosaicRequest = {
        layers: [
          { layerName: 'amsterdam_5cm', zIndex: 1 },
          { layerName: 'LayerNameIsNotExists', zIndex: 0 },
        ],
      };
      // action
      const action = () => layersManager.updateMosaic(mockMosaicName, mockUpdateMosaicRequest);
      // expectation
      expect(action).toThrow(NotFoundError);
      expect(convertYamlToJsonStub).toHaveBeenCalledTimes(1);
      expect(sortArrayByZIndexStub).toHaveBeenCalledTimes(0);
      expect(convertJsonToYamlStub).not.toHaveBeenCalled();
      expect(replaceYamlContentStub).not.toHaveBeenCalled();
    });

    it('should reject with not found error due mosaic name is not exists', function () {
      // mock
      const mockMosaicName = 'NotExistsMosaicName';
      const mockUpdateMosaicRequest: IUpdateMosaicRequest = {
        layers: [
          { layerName: 'amsterdam_5cm', zIndex: 1 },
          { layerName: 'NameIsAlreadyExists', zIndex: 0 },
        ],
      };
      // action
      const action = () => layersManager.updateMosaic(mockMosaicName, mockUpdateMosaicRequest);
      // expectation
      expect(action).toThrow(NotFoundError);
      expect(convertYamlToJsonStub).toHaveBeenCalledTimes(1);
      expect(sortArrayByZIndexStub).toHaveBeenCalledTimes(0);
      expect(convertJsonToYamlStub).not.toHaveBeenCalled();
      expect(replaceYamlContentStub).not.toHaveBeenCalled();
    });
  });

  describe('#removeLayer', () => {
    it('should successfully remove layer', function () {
      // mock
      const mockLayerName = 'mockLayerNameExists';
      // action
      const action = () => layersManager.removeLayer(mockLayerName);
      // expectation
      expect(action).not.toThrow();
      expect(convertYamlToJsonStub).toHaveBeenCalledTimes(1);
      expect(convertJsonToYamlStub).toHaveBeenCalledTimes(1);
      expect(replaceYamlContentStub).toHaveBeenCalledTimes(1);
    });

    it('should reject with not found error due layer name is not exists', function () {
      // mock
      const mockLayerName = 'mockLayerNameIsNotExists';
      // action
      const action = () => layersManager.removeLayer(mockLayerName);
      // expectation
      expect(action).toThrow(NotFoundError);
      expect(convertYamlToJsonStub).toHaveBeenCalledTimes(1);
      expect(convertJsonToYamlStub).not.toHaveBeenCalled();
      expect(replaceYamlContentStub).not.toHaveBeenCalled();
    });
  });

  describe('#updateLayer', () => {
    const mockUpdateLayerRequest: ILayerPostRequest = {
      name: 'amsterdam_5cm',
      tilesPath: '/path/to/tiles/directory/in/my/bucket/',
      maxZoomLevel: 18,
      description: 'description for amsterdam layer',
    };

    it('should successfully update layer', function () {
      // mock
      const mockLayerName = 'mockLayerNameExists';
      // action
      const action = () => layersManager.updateLayer(mockLayerName, mockUpdateLayerRequest);
      // expectation
      expect(action).not.toThrow();
      expect(convertYamlToJsonStub).toHaveBeenCalledTimes(1);
      expect(convertJsonToYamlStub).toHaveBeenCalledTimes(1);
      expect(replaceYamlContentStub).toHaveBeenCalledTimes(1);
    });

    it('should reject with not found error due layer name is not exists', function () {
      // mock
      const mockLayerName = 'mockLayerNameIsNotExists';
      // action
      const action = () => layersManager.updateLayer(mockLayerName, mockUpdateLayerRequest);
      // expectation
      expect(action).toThrow(NotFoundError);
      expect(convertYamlToJsonStub).toHaveBeenCalledTimes(1);
      expect(convertJsonToYamlStub).not.toHaveBeenCalled();
      expect(replaceYamlContentStub).not.toHaveBeenCalled();
    });
  });
});
