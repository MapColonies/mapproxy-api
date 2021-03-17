import { IFileProvider } from '../../../src/common/interfaces';

export class MockFileProvider implements IFileProvider {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async uploadFile(filePath: string): Promise<void> {
    return Promise.resolve();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async getFile(filePath: string): Promise<void> {
    return Promise.resolve();
  }
}
