import { readFileSync } from 'node:fs';
import jsyaml, { YAMLException } from 'js-yaml';
import * as utils from '../../../../src/common/utils';
import { IMapProxyJsonDocument, IMapProxyLayer } from '../../../../src/common/interfaces';

let safeLoadStub: jest.SpyInstance;
let safeDumpStub: jest.SpyInstance;
let replaceYamlFileContentStub: jest.SpyInstance;

describe('utils', () => {
  beforeEach(function () {
    // stub util functions
    safeLoadStub = jest.spyOn(jsyaml, 'safeLoad');
    safeDumpStub = jest.spyOn(jsyaml, 'safeDump');
    replaceYamlFileContentStub = jest.spyOn(utils, 'replaceYamlFileContent');
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  describe('#convertYamlToJson', () => {
    it('should convert yaml content to json object', function () {
      // mock
      const mockYamlFile = 'tests/unit/mock/mockContent.yaml';
      const yamlContent = readFileSync(mockYamlFile, { encoding: 'utf8' });
      // action
      const action = () => utils.convertYamlToJson(yamlContent);
      // expectation
      expect(typeof action()).toBe('object');
      expect(safeLoadStub).toHaveBeenCalledTimes(1);
    });

    it('should reject with invalid yaml syntax', function () {
      // mock
      const invalidYamlSyntaxFile = 'tests/unit/mock/mockInvalidYamlSyntax.yaml';
      const yamlContent = readFileSync(invalidYamlSyntaxFile, { encoding: 'utf8' });
      // action
      const action = () => utils.convertYamlToJson(yamlContent);
      // expectation
      expect(action).toThrow(YAMLException);
      expect(safeLoadStub).toHaveBeenCalledTimes(1);
    });
  });

  describe('#convertJsonToYaml', () => {
    it('should convert json object content to yaml content', function () {
      // mock
      const mockYamlFile = 'tests/unit/mock/mockContent.yaml';
      const yamlContent = readFileSync(mockYamlFile, { encoding: 'utf8' });
      const mockConvertedJson: IMapProxyJsonDocument = utils.convertYamlToJson(yamlContent);
      // action
      const convertedYaml: string = utils.convertJsonToYaml(mockConvertedJson);
      // expectation
      expect(typeof convertedYaml).toBe('string');
      expect(safeDumpStub).toHaveBeenCalledTimes(1);
    });

    it('should output numeric values without quotes (noCompatMode)', function () {
      // mock - json document with numeric values, a YAML 1.1 boolean-like string, and a numeric string key
      const jsonDoc = { '404': { test: 'value' }, minZoom: 0, maxZoom: 18, epsg: 4326, status: 'yes' } as unknown as IMapProxyJsonDocument;
      // action
      const convertedYaml: string = utils.convertJsonToYaml(jsonDoc);
      // expectation - numeric string key '404' must appear unquoted
      expect(convertedYaml).toMatch(/404:/);
      expect(convertedYaml).not.toMatch(/['"]404['"]\s*:/);
      // expectation - numeric values must appear as plain scalars (no quotes)
      expect(convertedYaml).toMatch(/minZoom: 0/);
      expect(convertedYaml).toMatch(/maxZoom: 18/);
      expect(convertedYaml).toMatch(/epsg: 4326/);
      expect(convertedYaml).not.toMatch(/minZoom: ['"](\d+)['"]/);
      expect(convertedYaml).not.toMatch(/maxZoom: ['"](\d+)['"]/);
      expect(convertedYaml).not.toMatch(/epsg: ['"](\d+)['"]/);
      // expectation - YAML 1.1 boolean alias 'yes' must not be quoted (noCompatMode: true)
      expect(convertedYaml).toMatch(/status: yes/);
      expect(convertedYaml).not.toMatch(/status: ['"](yes)['"]/);
    });
  });

  describe('#replaceYamlFileContent', () => {
    it('should replace file content with the requested yaml content', function () {
      // mock
      const mockYamlFile = 'tests/unit/mock/mockContent.yaml';
      const yamlContent = readFileSync(mockYamlFile, { encoding: 'utf8' });
      const mockConvertedJson: IMapProxyJsonDocument = utils.convertYamlToJson(yamlContent);
      const mockLayer: IMapProxyLayer = {
        name: 'mockLayer',
        sources: ['mockSource'],
      };

      expect(mockConvertedJson.layers).not.toContainEqual(mockLayer);
      mockConvertedJson.layers.push(mockLayer);

      // action
      const convertedYaml: string = utils.convertJsonToYaml(mockConvertedJson);
      const newConvertedJson: IMapProxyJsonDocument = jsyaml.safeLoad(convertedYaml) as IMapProxyJsonDocument;
      replaceYamlFileContentStub.mockResolvedValue(undefined);
      const action = async () => utils.replaceYamlFileContent(mockYamlFile, convertedYaml);

      // expectation
      expect(action).not.toThrow();
      expect(typeof convertedYaml).toBe('string');
      expect(newConvertedJson.layers).toContainEqual(mockLayer);
    });
  });

  describe('#getFileExtension', () => {
    it('should return the file extension from a path', function () {
      // mock
      const path = '/path/to/file.gpkg';
      // action
      const result: string = utils.getFileExtension(path);

      // expectation
      expect(result).toBe('.gpkg');
    });

    it('should return the empty string if the path does not contain file extension', function () {
      // mock
      const path = '/path/to/dir/';
      // action
      const result = utils.getFileExtension(path);

      // expectation
      expect(result).toBe('');
    });
  });
});
