import { container } from 'tsyringe';
import jsLogger from '@map-colonies/js-logger';
import { NotFoundError } from '@map-colonies/error-types';
import { IMapProxyConfig, IMapProxyJsonDocument } from '../../../../src/common/interfaces';
import { ConfigsManager } from '../../../../src/configs/models/configsManager';
import { MockConfigProvider, getJsonMock, init as initConfigProvider } from '../../mock/mockConfigProvider';
import { SERVICES } from '../../../../src/common/constants';
import { registerTestValues } from '../../../integration/testContainerConfig';
import { mockData } from '../../mock/mockData';

let configManager: ConfigsManager;
const logger = jsLogger({ enabled: false });

describe('layersManager', () => {
  beforeEach(() => {
    // stub util functions
    registerTestValues();
    initConfigProvider();
    const mapproxyConfig = container.resolve<IMapProxyConfig>(SERVICES.MAPPROXY);
    configManager = new ConfigsManager(logger, mapproxyConfig, MockConfigProvider);
  });

  afterEach(() => {
    container.reset();
    container.clearInstances();
    jest.clearAllMocks();
  });

  describe('#getConfig', () => {
    it('should successfully return the current config', async () => {
      const resultData = mockData();
      getJsonMock.mockResolvedValue(resultData);

      // action
      const resource: IMapProxyJsonDocument = await configManager.getConfig();
      // expectation;
      expect(getJsonMock).toHaveBeenCalledTimes(1);
      expect(resource).toBe(resultData);
    });

    it('should reject with error', async () => {
      // action
      getJsonMock.mockImplementation(() => {
        throw new NotFoundError('some connect problem');
      });
      const action = async () => {
        await configManager.getConfig();
      };
      // expectation;
      await expect(action).rejects.toThrow(new NotFoundError('some connect problem'));
      expect(getJsonMock).toHaveBeenCalledTimes(1);
    });
  });
});
