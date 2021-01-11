import { ResourceNameManager } from '../../../../src/resourceName/models/resourceNameManager';

let resourceNameManager: ResourceNameManager;

describe('ResourceNameManager', () => {
  beforeEach(function () {
    resourceNameManager = new ResourceNameManager({ log: jest.fn() });
  });
  describe('#getResource', () => {
    it('return the resource of id 1', function () {
      // action
      const resource = resourceNameManager.getResource();

      // expectation
      expect(resource.id).toEqual(1);
      expect(resource.name).toEqual('ronin');
      expect(resource.description).toEqual('can you do a logistics run?');
    });
  });
});
