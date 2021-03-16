/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable import/exports-last */
import { injectable } from 'tsyringe';
import { IFileProvider } from '../interfaces';

@injectable()
export class FSProvider implements IFileProvider {
  public async uploadFile(filePath: string): Promise<void> {
    return Promise.resolve();
  }

  public async getFile(filePath: string): Promise<void> {
    return Promise.resolve();
  }
}
