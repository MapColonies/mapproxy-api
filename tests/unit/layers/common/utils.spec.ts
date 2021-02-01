import fs from 'fs';
import jsyaml from 'js-yaml';
import * as utils from '../../../../src/common/utils';
import { ServiceUnavailableError } from '../../../../src/common/exceptions/http/serviceUnavailableError';
import { IMapProxyJsonDocument } from '../../../../src/common/interfaces';


let safeLoadStub: jest.SpyInstance;
let safeDumpStub: jest.SpyInstance;
let readFileSyncStub: jest.SpyInstance;
let writeFileSyncStub: jest.SpyInstance;
describe('utils', () => {
  beforeEach(function () {
    // stub util functions
    safeLoadStub = jest.spyOn(jsyaml, 'safeLoad');
    safeDumpStub = jest.spyOn(jsyaml, 'safeDump');
    readFileSyncStub = jest.spyOn(fs, 'readFileSync');
    writeFileSyncStub = jest.spyOn(fs, 'writeFileSync');
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  describe('#convertYamlToJson', () => {
    it('should convert yaml content to json object', function () {
      // mock
      const mockYamlFile = 'tests/unit/mock/mockContent.yaml';
      // action
      const convertedJson: IMapProxyJsonDocument = utils.convertYamlToJson(mockYamlFile);
      // expectation
      expect(typeof(convertedJson)).toBe('object');
      expect(readFileSyncStub).toHaveBeenCalled();
      expect(safeLoadStub).toHaveBeenCalled();
    });
    it('should reject with file not found or not exists', function () {
        // mock
        const mockNotExistsYamlFile = 'tests/unit/mock/notFound.yaml';
        // action
        const action = () => utils.convertYamlToJson(mockNotExistsYamlFile);
        // expectation
        expect(action).toThrow(ServiceUnavailableError);
        expect(readFileSyncStub).toHaveBeenCalled();
        expect(safeLoadStub).not.toHaveBeenCalled();
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
      expect(typeof(convertedYaml)).toBe('string');
      expect(safeDumpStub).toHaveBeenCalled();
    });
  });
});
