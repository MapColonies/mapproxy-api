import httpStatusCodes from 'http-status-codes';
import { container } from 'tsyringe';
import { IResourceNameModel } from '../../../src/resourceName/models/resourceNameManager';

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
      const response = await requestSender.getResource();

      expect(response.status).toBe(httpStatusCodes.OK);

      const resource = response.body as IResourceNameModel;
      expect(resource.id).toEqual(1);
      expect(resource.name).toEqual('ronin');
      expect(resource.description).toEqual('can you do a logistics run?');
    });
  });
  describe('Bad Path', function () {
    // All requests with status code of 400
  });
  describe('Sad Path', function () {
    // All requests with status code 4XX-5XX
  });
});
