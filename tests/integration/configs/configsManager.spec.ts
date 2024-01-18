import httpStatusCodes from 'http-status-codes';
import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import config from 'config';
import { container } from 'tsyringe';
import { NotFoundError } from '@map-colonies/error-types';
import { IFSConfig, IMapProxyConfig, IMapProxyJsonDocument, IS3Config } from '../../../src/common/interfaces';
import { MockConfigProvider, init as configProviderInit, getJsonMock } from '../../unit/mock/mockConfigProvider';
import * as utils from '../../../src/common/utils';
import { getApp } from '../../../src/app';
import { SERVICES } from '../../../src/common/constants';
import { configsRouterFactory, CONFIGS_ROUTER_SYMBOL } from '../../../src/configs/routes/configsRouterFactory';
import { ConfigsRequestSender } from '../configs/helpers/requestSender';
import { mockData } from '../../unit/mock/mockData';

let requestSender: ConfigsRequestSender;
describe('configManager', () => {
  beforeEach(() => {
    const mapproxyConfig = config.get<IMapProxyConfig>('mapproxy');
    const fsConfig = config.get<IFSConfig>('FS');
    const s3Config = config.get<IS3Config>('S3');
    configProviderInit();
    /* eslint-disable-next-line @typescript-eslint/naming-convention*/
    const app = getApp({
      override: [
        { token: SERVICES.MAPPROXY, provider: { useValue: mapproxyConfig } },
        { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
        { token: SERVICES.TRACER, provider: { useValue: trace.getTracer('testTracer') } },
        { token: SERVICES.CONFIG, provider: { useValue: config } },
        { token: CONFIGS_ROUTER_SYMBOL, provider: { useFactory: configsRouterFactory } },
        { token: SERVICES.FS, provider: { useValue: fsConfig } },
        { token: SERVICES.S3, provider: { useValue: s3Config } },
        {
          token: SERVICES.CONFIGPROVIDER,
          provider: {
            useValue: MockConfigProvider,
          },
        },
      ],
      useChild: false,
    });
    requestSender = new ConfigsRequestSender(app);
    // jest.spyOn(utils, 'replaceYamlFileContent').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
    jest.clearAllMocks();
    container.reset();
    container.clearInstances();
  });

  describe('#getConfig', () => {
    it('Happy Path - should return status 200 and current config as json default', async () => {
      const mockMapproxyConfig = mockData();
      getJsonMock.mockResolvedValue(mockMapproxyConfig);
      const response = await requestSender.getConfig();

      expect(response.status).toBe(httpStatusCodes.OK);
      const resource = response.body as IMapProxyJsonDocument;
      expect(response).toSatisfyApiSpec();
      expect(resource).toEqual(mockMapproxyConfig);
    });

    it('Happy Path - should return status 200 and current config as yaml', async () => {
      const mockMapproxyConfig = mockData();
      getJsonMock.mockResolvedValue(mockMapproxyConfig);
      const response = await requestSender.getConfigYaml();
      expect(response.status).toBe(httpStatusCodes.OK);
      const resource = response.text;
      expect(response).toSatisfyApiSpec();
      expect(resource).toEqual(utils.convertJsonToYaml(mockMapproxyConfig));
    });

    it('Sad Path - should fail with response status 404 Not Found and config not exists', async () => {
      getJsonMock.mockImplementation(() => {
        throw new NotFoundError('some connect problem');
      });
      const response = await requestSender.getConfig();

      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
      expect(response.body).toEqual({ message: 'some connect problem' });
    });
  });
});
