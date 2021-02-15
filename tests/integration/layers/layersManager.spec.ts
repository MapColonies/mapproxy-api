import httpStatusCodes from 'http-status-codes';
import { container } from 'tsyringe';
import { IMapProxyCache } from '../../../src/common/interfaces';

import { registerTestValues } from '../testContainerConfig';
import * as requestSender from './helpers/requestSender';

describe('layerManager', function () {
  beforeAll(function () {
    registerTestValues();
    requestSender.init();
  });
  afterEach(function () {
    container.clearInstances();
  });

  describe('#getLayer', function () {
    it('Happy Path', async function () {
      const response = await requestSender.getLayer('mockLayerNameExists');

      expect(response.status).toBe(httpStatusCodes.OK);

      const resource = response.body as IMapProxyCache;
      expect(resource.sources).toEqual([]);
      expect(resource.upscale_tiles).toEqual(18);
      expect(resource.request_format).toEqual('image/png');
      expect(resource.grids).toEqual(['epsg4326dir']);
      // eslint-disable-next-line @typescript-eslint/naming-convention
      expect(resource.cache).toEqual({ directory: '/path/to/s3/directory/tile', directory_layout: 'tms', type: 's3' });
    });
    it('Sad Path', async function () {
      const mockLayerName = 'mockLayerNameIsNotExists';
      const response = await requestSender.getLayer(mockLayerName);
      const notFoundErrorMessage = `Layer name '${mockLayerName}' is not exists`;

      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
      expect(response.body).toEqual({ message: notFoundErrorMessage });
    });
  });
});
