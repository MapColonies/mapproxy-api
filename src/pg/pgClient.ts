import { Pool, PoolClient, PoolConfig } from 'pg';
import { container, injectable } from 'tsyringe';
import { Services } from '../common/constants';
import { IConfig, IDBConfig } from '../common/interfaces';

@injectable()
export class PGClient {
  private readonly pool: Pool;
  public constructor() {
    const config: IConfig = container.resolve(Services.CONFIG);
    const dbConfig: IDBConfig = config.get<IDBConfig>('DB');
    const pgClientConfig: PoolConfig = {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      password: dbConfig.password,
      port: dbConfig.port,
    };
    this.pool = new Pool(pgClientConfig);
  }

  public async getPoolConnection(): Promise<PoolClient> {
    const client = await this.pool.connect();
    return client;
  }
}
