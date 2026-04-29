import { readFileSync } from 'node:fs';
import { Pool, PoolClient, PoolConfig } from 'pg';
import { container, injectable } from 'tsyringe';
import { SERVICES } from '../../common/constants';
import type { IDBConfig } from '../../common/interfaces';
import type { ConfigType } from '@src/common/config';

@injectable()
export class PGClient {
  private readonly pool: Pool;
  public constructor() {
    const config = container.resolve<ConfigType>(SERVICES.CONFIG);
    const dbConfig = config.get('DB') as IDBConfig;
    const pgClientConfig: PoolConfig = {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      password: dbConfig.password,
      port: dbConfig.port,
    };
    if (dbConfig.sslEnabled) {
      pgClientConfig.ssl = {
        rejectUnauthorized: dbConfig.rejectUnauthorized,
        key: readFileSync(dbConfig.sslPaths.key),
        cert: readFileSync(dbConfig.sslPaths.cert),
        ca: readFileSync(dbConfig.sslPaths.ca),
      };
    }
    this.pool = new Pool(pgClientConfig);
  }

  public async getPoolConnection(): Promise<PoolClient> {
    const client = await this.pool.connect();
    return client;
  }
}
