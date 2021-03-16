import config from 'config';
import { ILayerPostRequest, ILayerToMosaicRequest, IMapProxyCache, IMapProxyConfig, IUpdateMosaicRequest } from '../../../../src/common/interfaces';
import { LayersManager } from '../../../../src/layers/models/layersManager';
import { ConfilctError } from '../../../../src/common/exceptions/http/confilctError';
import { mockLayerNameAlreadyExists } from '../../mock/mockLayerNameAlreadyExists';
import { mockLayerNameIsNotExists } from '../../mock/mockLayerNameIsNotExists';
import * as utils from '../../../../src/common/utils';
import { NotFoundError } from '../../../../src/common/exceptions/http/notFoundError';
import { S3Provider } from '../../../../src/common/providers/S3Provider';

let layersManager: LayersManager;
let convertYamlToJsonStub: jest.SpyInstance;
let convertJsonToYamlStub: jest.SpyInstance;
let replaceYamlContentStub: jest.SpyInstance;
let sortArrayByZIndexStub: jest.SpyInstance;
const getFileStub = jest.fn();
const uploadFileStub = jest.fn();

const mapproxyConfig = config.get<IMapProxyConfig>('mapproxy');
describe('layersManager', () => {
  beforeEach(function () {
    const s3ClientMock = ({
      getFile: getFileStub,
      uploadFile: uploadFileStub,
    } as unknown) as S3Provider;

    layersManager = new LayersManager({ log: jest.fn() }, mapproxyConfig, s3ClientMock);
    // stub util functions
    uploadFileStub.mockResolvedValue(undefined);
    getFileStub.mockResolvedValue(undefined);
    convertYamlToJsonStub = jest.spyOn(utils, 'convertYamlToJson');
    convertJsonToYamlStub = jest.spyOn(utils, 'convertJsonToYaml');
    replaceYamlContentStub = jest.spyOn(utils, 'replaceYamlFileContent').mockReturnValueOnce(undefined);
    sortArrayByZIndexStub = jest.spyOn(utils, 'sortArrayByZIndex').mockReturnValueOnce(['mockLayer1', 'mockLayer2', 'mockLayer3']);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('#getLayer', () => {
    it('should successfully return the requested layer', async function () {
      // action
      const resource: IMapProxyCache = await layersManager.getLayer('mockLayerNameExists');
      // expectation;
      expect(getFileStub).toHaveBeenCalledTimes(1);
      expect(resource.sources).toEqual([]);
      expect(resource.upscale_tiles).toEqual(18);
      expect(resource.request_format).toEqual('image/png');
      expect(resource.grids).toEqual(['epsg4326dir']);
      // eslint-disable-next-line @typescript-eslint/naming-convention
      expect(resource.cache).toEqual({ directory: '/path/to/s3/directory/tile', directory_layout: 'tms', type: 's3' });
    });

    it('should reject with not found error', async function () {
      // action
      const action = async () => {
        await layersManager.getLayer('mockLayerNameIsNotExists');
      };
      // expectation;
      await expect(action).rejects.toThrow(NotFoundError);
      expect(getFileStub).toHaveBeenCalledTimes(1);
      expect(uploadFileStub).not.toHaveBeenCalled();
    });
  });

  describe('#addLayer', () => {
    it('should reject with conflict error', async function () {
      // action
      const action = async () => {
        await layersManager.addLayer(mockLayerNameAlreadyExists);
      };
      // expectation
      await expect(action).rejects.toThrow(ConfilctError);
      expect(getFileStub).toHaveBeenCalledTimes(1);
      expect(convertYamlToJsonStub).toHaveBeenCalledTimes(1);
      expect(convertJsonToYamlStub).not.toHaveBeenCalled();
      expect(replaceYamlContentStub).not.toHaveBeenCalled();
      expect(uploadFileStub).not.toHaveBeenCalled();
    });

    it('should successfully add layer', async function () {
      // action
      const action = async () => {
        await layersManager.addLayer(mockLayerNameIsNotExists);
      };

      // expectation
      await expect(action()).resolves.not.toThrow();
      expect(getFileStub).toHaveBeenCalledTimes(1);
      expect(convertYamlToJsonStub).toHaveBeenCalledTimes(1);
      expect(convertJsonToYamlStub).toHaveBeenCalledTimes(1);
      expect(replaceYamlContentStub).toHaveBeenCalledTimes(1);
      expect(uploadFileStub).toHaveBeenCalledTimes(1);
    });
  });

  describe('#addLayerToMosaic', () => {
    it('should reject with not found error due layer name is not exists', async function () {
      // mock
      const mockMosaicName = 'mosaicMockName';
      const mockLayerNotExistsToMosaicRequest: ILayerToMosaicRequest = {
        layerName: 'layerNameIsNotExists',
      };
      // action
      const action = async () => {
        await layersManager.addLayerToMosaic(mockMosaicName, mockLayerNotExistsToMosaicRequest);
      };
      // expectation
      await expect(action).rejects.toThrow(NotFoundError);
      expect(getFileStub).toHaveBeenCalledTimes(1);
      expect(convertYamlToJsonStub).toHaveBeenCalledTimes(1);
      expect(convertJsonToYamlStub).not.toHaveBeenCalled();
      expect(replaceYamlContentStub).not.toHaveBeenCalled();
      expect(uploadFileStub).not.toHaveBeenCalled();
    });

    it('should reject with not found error due mosaic name is not exists', async function () {
      // mock
      const mockMosaicName = 'mosaicNameIsNotExists';
      const mockLayerToMosaicRequest: ILayerToMosaicRequest = {
        layerName: 'mockLayerNameExists',
      };
      // action
      const action = async () => {
        await layersManager.addLayerToMosaic(mockMosaicName, mockLayerToMosaicRequest);
      };
      // expectation
      await expect(action).rejects.toThrow(NotFoundError);
      expect(getFileStub).toHaveBeenCalledTimes(1);
      expect(convertYamlToJsonStub).toHaveBeenCalledTimes(1);
      expect(convertJsonToYamlStub).not.toHaveBeenCalled();
      expect(replaceYamlContentStub).not.toHaveBeenCalled();
      expect(uploadFileStub).not.toHaveBeenCalled();
    });

    it('should successfully add layer to mosaic', async function () {
      // mock
      const mockMosaicName = 'existsMosaicName';
      const mockLayerToMosaicRequest: ILayerToMosaicRequest = {
        layerName: 'mockLayerNameExists',
      };
      // action
      const action = async () => {
        await layersManager.addLayerToMosaic(mockMosaicName, mockLayerToMosaicRequest);
      };
      // expectation
      await expect(action()).resolves.not.toThrow();
      expect(getFileStub).toHaveBeenCalledTimes(1);
      expect(convertYamlToJsonStub).toHaveBeenCalledTimes(1);
      expect(convertJsonToYamlStub).toHaveBeenCalledTimes(1);
      expect(replaceYamlContentStub).toHaveBeenCalledTimes(1);
      expect(uploadFileStub).toHaveBeenCalledTimes(1);
    });
  });

  describe('#updateMosaic', () => {
    it('should successfully update mosaic layers by thier z-index', async function () {
      // mock
      const mockMosaicName = 'existsMosaicName';
      const mockUpdateMosaicRequest: IUpdateMosaicRequest = {
        layers: [
          { layerName: 'amsterdam_5cm', zIndex: 1 },
          { layerName: 'NameIsAlreadyExists', zIndex: 0 },
        ],
      };
      // action
      const action = async () => {
        await layersManager.updateMosaic(mockMosaicName, mockUpdateMosaicRequest);
      };
      // expectation
      await expect(action()).resolves.not.toThrow();
      expect(getFileStub).toHaveBeenCalledTimes(1);
      expect(convertYamlToJsonStub).toHaveBeenCalledTimes(1);
      expect(sortArrayByZIndexStub).toHaveBeenCalledTimes(1);
      expect(convertJsonToYamlStub).toHaveBeenCalledTimes(1);
      expect(replaceYamlContentStub).toHaveBeenCalledTimes(1);
      expect(uploadFileStub).toHaveBeenCalledTimes(1);
    });

    it('should reject with not found error due layer name is not exists', async function () {
      // mock
      const mockMosaicName = 'existsMosaicName';
      const mockUpdateMosaicRequest: IUpdateMosaicRequest = {
        layers: [
          { layerName: 'amsterdam_5cm', zIndex: 1 },
          { layerName: 'LayerNameIsNotExists', zIndex: 0 },
        ],
      };
      // action
      const action = async () => {
        await layersManager.updateMosaic(mockMosaicName, mockUpdateMosaicRequest);
      };
      // expectation
      await expect(action).rejects.toThrow(NotFoundError);
      expect(getFileStub).toHaveBeenCalledTimes(1);
      expect(convertYamlToJsonStub).toHaveBeenCalledTimes(1);
      expect(sortArrayByZIndexStub).toHaveBeenCalledTimes(0);
      expect(convertJsonToYamlStub).not.toHaveBeenCalled();
      expect(replaceYamlContentStub).not.toHaveBeenCalled();
      expect(uploadFileStub).not.toHaveBeenCalled();
    });

    it('should reject with not found error due mosaic name is not exists', async function () {
      // mock
      const mockMosaicName = 'NotExistsMosaicName';
      const mockUpdateMosaicRequest: IUpdateMosaicRequest = {
        layers: [
          { layerName: 'amsterdam_5cm', zIndex: 1 },
          { layerName: 'NameIsAlreadyExists', zIndex: 0 },
        ],
      };
      // action
      const action = async () => {
        await layersManager.updateMosaic(mockMosaicName, mockUpdateMosaicRequest);
      };
      // expectation
      await expect(action).rejects.toThrow(NotFoundError);
      expect(getFileStub).toHaveBeenCalledTimes(1);
      expect(convertYamlToJsonStub).toHaveBeenCalledTimes(1);
      expect(sortArrayByZIndexStub).toHaveBeenCalledTimes(0);
      expect(convertJsonToYamlStub).not.toHaveBeenCalled();
      expect(replaceYamlContentStub).not.toHaveBeenCalled();
      expect(uploadFileStub).not.toHaveBeenCalled();
    });
  });

  describe('#removeLayer', () => {
    it('should successfully remove layer', async function () {
      // mock
      const mockLayerName = 'mockLayerNameExists';
      // action
      const action = async () => {
        await layersManager.removeLayer(mockLayerName);
      };
      // expectation
      await expect(action()).resolves.not.toThrow();
      expect(getFileStub).toHaveBeenCalledTimes(1);
      expect(convertYamlToJsonStub).toHaveBeenCalledTimes(1);
      expect(convertJsonToYamlStub).toHaveBeenCalledTimes(1);
      expect(replaceYamlContentStub).toHaveBeenCalledTimes(1);
      expect(uploadFileStub).toHaveBeenCalledTimes(1);
    });

    it('should reject with not found error due layer name is not exists', async function () {
      // mock
      const mockLayerName = 'mockLayerNameIsNotExists';
      // action
      const action = async () => {
        await layersManager.removeLayer(mockLayerName);
      };
      // expectation
      await expect(action).rejects.toThrow(NotFoundError);
      expect(getFileStub).toHaveBeenCalledTimes(1);
      expect(convertYamlToJsonStub).toHaveBeenCalledTimes(1);
      expect(convertJsonToYamlStub).not.toHaveBeenCalled();
      expect(replaceYamlContentStub).not.toHaveBeenCalled();
      expect(uploadFileStub).not.toHaveBeenCalled();
    });
  });

  describe('#updateLayer', () => {
    const mockUpdateLayerRequest: ILayerPostRequest = {
      name: 'amsterdam_5cm',
      tilesPath: '/path/to/tiles/directory/in/my/bucket/',
      maxZoomLevel: 18,
      description: 'description for amsterdam layer',
    };

    it('should successfully update layer', async function () {
      // mock
      const mockLayerName = 'mockLayerNameExists';
      // action
      const action = async () => {
        await layersManager.updateLayer(mockLayerName, mockUpdateLayerRequest);
      };
      // expectation
      await expect(action()).resolves.not.toThrow();
      expect(getFileStub).toHaveBeenCalledTimes(1);
      expect(convertYamlToJsonStub).toHaveBeenCalledTimes(1);
      expect(convertJsonToYamlStub).toHaveBeenCalledTimes(1);
      expect(replaceYamlContentStub).toHaveBeenCalledTimes(1);
      expect(uploadFileStub).toHaveBeenCalledTimes(1);
    });

    it('should reject with not found error due layer name is not exists', async function () {
      // mock
      const mockLayerName = 'mockLayerNameIsNotExists';
      // action
      const action = async () => {
        await layersManager.updateLayer(mockLayerName, mockUpdateLayerRequest);
      };
      // expectation
      await expect(action).rejects.toThrow(NotFoundError);
      expect(getFileStub).toHaveBeenCalledTimes(1);
      expect(convertYamlToJsonStub).toHaveBeenCalledTimes(1);
      expect(convertJsonToYamlStub).not.toHaveBeenCalled();
      expect(replaceYamlContentStub).not.toHaveBeenCalled();
      expect(uploadFileStub).not.toHaveBeenCalled();
    });
  });
});
