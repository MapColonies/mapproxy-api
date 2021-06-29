import { DBProvider } from './common/providers/dbProvider';
import { FSProvider } from './common/providers/fSProvider';
import { S3Provider } from './common/providers/s3Provider';
import { IFileProvider } from './common/interfaces';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const getProvider = (provider: string): IFileProvider => {
  switch (provider.toLowerCase()) {
    case 'fs':
      return new FSProvider();
    case 's3':
      return new S3Provider();
    case 'db':
      return new DBProvider();
    default:
      throw new Error(`Invalid ${provider} Congiuration - Please define one of the config providers:  "fs", "s3", "db"`)
  }
};
