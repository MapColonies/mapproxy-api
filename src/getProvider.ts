import { DBProvider } from './common/providers/dbProvider';
import { FSProvider } from './common/providers/fSProvider';
import { S3Provider } from './common/providers/s3Provider';
import { IConfigProvider } from './common/interfaces';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const getProvider = (provider: string): IConfigProvider => {
  switch (provider.toLowerCase()) {
    case 'fs':
      return new FSProvider();
    case 's3':
      return new S3Provider();
    case 'db':
      return new DBProvider();
    default:
      throw new Error(`Invalid config provider received: ${provider} - available values:  "fs", "s3" or "db"`);
  }
};
