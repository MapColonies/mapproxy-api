import httpStatusCodes from 'http-status-codes';
import { container } from 'tsyringe';
import { ILayerPostRequest } from '../../../src/common/interfaces';

import { registerTestValues } from '../testContainerConfig';
import * as requestSender from './helpers/requestSender';

describe('resourceName', function () {
  beforeAll(function () {
    registerTestValues();
    requestSender.init();
  });
  afterEach(function () {
    container.clearInstances();
  });

  describe('Happy Path', function () {
    it('should return 200 status code and the resource', async function () {
      const response = await requestSender.getLayer();

      expect(response.status).toBe(httpStatusCodes.OK);

      const resource = response.body as ILayerPostRequest;
      expect(resource.id).toEqual(1);
      expect(resource.name).toEqual('amsterdam_5cm');
      expect(resource.maxZoomLevel).toEqual(18);
      expect(resource.tilesPath).toEqual('/path/to/s3/directory/tile');
      expect(resource.description).toEqual('amsterdam 5m layer discription');
    });
  });
  describe('Bad Path', function () {
    // All requests with status code of 400
  });
  describe('Sad Path', function () {
    // All requests with status code 4XX-5XX
  });
});
