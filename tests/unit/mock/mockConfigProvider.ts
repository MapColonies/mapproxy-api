/* eslint-disable @typescript-eslint/no-unused-vars */
import { promises as fsp } from 'fs';
import { IConfigProvider, IMapProxyJsonDocument } from '../../../src/common/interfaces';

export class MockConfigProvider implements IConfigProvider {
  // eslint-disable-next-line @typescript-eslint/require-await
  public async updateJson(jsonContent: IMapProxyJsonDocument): Promise<void> {
    void Promise.resolve(undefined);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async getJson(): Promise<IMapProxyJsonDocument> {
    const mockJsonData = await fsp.readFile('tests/unit/mock/mockJson.json', { encoding: 'utf8' });
    return (Promise.resolve(JSON.parse(mockJsonData)) as unknown) as IMapProxyJsonDocument;
  }
}
