import jsyaml, { YAMLException } from 'js-yaml';
import * as utils from '../../../../src/common/utils';
import { ServiceUnavailableError } from '../../../../src/common/exceptions/http/serviceUnavailableError';
import { IMapProxyJsonDocument, IMapProxyLayer, IMosaicLayerObject } from '../../../../src/common/interfaces';

let safeLoadStub: jest.SpyInstance;
let safeDumpStub: jest.SpyInstance;
let sortArrayByZIndexStub: jest.SpyInstance;
let replaceYamlFileContentStub: jest.SpyInstance;
describe('utils', () => {
  beforeEach(function () {
    // stub util functions
    safeLoadStub = jest.spyOn(jsyaml, 'safeLoad');
    safeDumpStub = jest.spyOn(jsyaml, 'safeDump');
    sortArrayByZIndexStub = jest.spyOn(utils, 'sortArrayByZIndex');
    replaceYamlFileContentStub = jest.spyOn(utils, 'replaceYamlFileContent');
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  describe('#convertYamlToJson', () => {
    it('should convert yaml content to json object', function () {
      // mock
      const mockYamlFile = 'tests/unit/mock/mockContent.yaml';
      // action
      const action = () => utils.convertYamlToJson(mockYamlFile);
      // expectation
      expect(typeof action()).toBe('object');
      expect(safeLoadStub).toHaveBeenCalledTimes(1);
    });
    it('should reject with file not found or not exists', function () {
      // mock
      const mockNotExistsYamlFile = 'tests/unit/mock/notFound.yaml';
      // action
      const action = () => utils.convertYamlToJson(mockNotExistsYamlFile);
      // expectation
      expect(action).toThrow(ServiceUnavailableError);
      expect(safeLoadStub).not.toHaveBeenCalled();
    });
    it('should reject with invalid yaml syntax', function () {
      // mock
      const invalidYamlSyntaxFile = 'tests/unit/mock/mockInvalidYamlSyntax.yaml';
      // action
      const action = () => utils.convertYamlToJson(invalidYamlSyntaxFile);
      // expectation
      expect(action).toThrow(YAMLException);
      expect(safeLoadStub).toHaveBeenCalledTimes(1);
    });
  });
  describe('#convertJsonToYaml', () => {
    it('should convert json object content to yaml content', function () {
      // mock
      const mockYamlFile = 'tests/unit/mock/mockContent.yaml';
      const mockConvertedJson: IMapProxyJsonDocument = utils.convertYamlToJson(mockYamlFile);
      // action
      const convertedYaml: string = utils.convertJsonToYaml(mockConvertedJson);
      // expectation
      expect(typeof convertedYaml).toBe('string');
      expect(safeDumpStub).toHaveBeenCalledTimes(1);
    });
  });
  describe('#replaceYamlFileContent', () => {
    it('should replace file content with the requested yaml content', function () {
      // mock
      const mockYamlFile = 'tests/unit/mock/mockContent.yaml';
      const mockConvertedJson: IMapProxyJsonDocument = utils.convertYamlToJson(mockYamlFile);
      const mockLayer: IMapProxyLayer = {
        name: 'mockLayer',
        sources: ['mockSource'],
      };
      expect(mockConvertedJson.layers).not.toContainEqual(mockLayer);
      mockConvertedJson.layers.push(mockLayer);
      // action
      const convertedYaml: string = utils.convertJsonToYaml(mockConvertedJson);
      const newConvertedJson: IMapProxyJsonDocument = jsyaml.safeLoad(convertedYaml) as IMapProxyJsonDocument;
      replaceYamlFileContentStub.mockReturnValueOnce(undefined);
      const action = () => utils.replaceYamlFileContent(mockYamlFile, convertedYaml);
      // expectation
      expect(action).not.toThrow();
      expect(typeof convertedYaml).toBe('string');
      expect(newConvertedJson.layers).toContainEqual(mockLayer);
    });
  });
  describe('#sortArrayByZIndex', () => {
    test('should sort an array in numerical order', function () {
      // mock
      const layers: IMosaicLayerObject[] = [
        { layerName: 'mockLayer1', zIndex: 2 },
        { layerName: 'mockLayer2', zIndex: 1 },
        { layerName: 'mockLayer3', zIndex: 0 },
      ];
      // action
      const action = () => utils.sortArrayByZIndex(layers);
      // expectation
      expect(layers[0].layerName).toBe('mockLayer1');
      expect(layers[1].layerName).toBe('mockLayer2');
      expect(layers[2].layerName).toBe('mockLayer3');
      expect(action()).toEqual(['mockLayer3', 'mockLayer2', 'mockLayer1']);
      expect(sortArrayByZIndexStub).toHaveReturned();
      expect(sortArrayByZIndexStub).toHaveBeenCalledTimes(1);
    });
  });
});
