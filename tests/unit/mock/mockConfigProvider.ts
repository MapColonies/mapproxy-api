import { readFileSync } from 'fs';
import { IConfigProvider, IMapProxyJsonDocument } from '../../../src/common/interfaces';

const updateJsonMock = jest.fn();
const getJsonMock = jest.fn();

const MockConfigProvider = {
  updateJson: updateJsonMock,
  getJson: getJsonMock
} as IConfigProvider;

const init = (): void =>{
  const mockJsonData =  readFileSync('tests/unit/mock/mockJson.json', { encoding: 'utf8' });
  const doc = JSON.parse(mockJsonData) as unknown as IMapProxyJsonDocument;

  updateJsonMock.mockImplementation(async (readJson:((doc:IMapProxyJsonDocument)=>IMapProxyJsonDocument))=>{
    readJson(doc);
    return Promise.resolve(undefined);
  });
  getJsonMock.mockImplementation(async ():Promise<IMapProxyJsonDocument> =>{
    return Promise.resolve(doc);
  })
}

export {updateJsonMock, getJsonMock, MockConfigProvider, init}
