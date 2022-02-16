import { readFileSync } from 'fs';
import { Pool, PoolConfig } from 'pg';
import { container } from 'tsyringe';
import { Services } from '../constants';
import { IConfigProvider, IDBConfig, IConfig, ILogger, IMapProxyJsonDocument } from '../interfaces';

export class DBProvider implements IConfigProvider {
  private readonly config: IConfig;
  private readonly dbConfig: IDBConfig;
  private readonly logger: ILogger;
  private readonly pool: Pool;
  public constructor() {
    this.logger = container.resolve(Services.LOGGER);
    this.config = container.resolve(Services.CONFIG);
    const config: IConfig = container.resolve(Services.CONFIG);
    this.dbConfig = config.get<IDBConfig>('DB');
    const pgClientConfig: PoolConfig = {
      host: this.dbConfig.host,
      user: this.dbConfig.user,
      database: this.dbConfig.database,
      password: this.dbConfig.password ? this.dbConfig.password : undefined,
      port: this.dbConfig.port,
    };
    if (this.dbConfig.sslEnabled) {
      pgClientConfig.ssl = {
        rejectUnauthorized: this.dbConfig.rejectUnauthorized,
        key: readFileSync(this.dbConfig.sslPaths.key),
        cert: readFileSync(this.dbConfig.sslPaths.cert),
        ca: readFileSync(this.dbConfig.sslPaths.ca),
      };
    }
    this.pool = new Pool(pgClientConfig);
  }

  public async updateJson(jsonContent: IMapProxyJsonDocument): Promise<void> {
    const client = await this.pool.connect();
    try {
      const data = JSON.stringify(jsonContent);
      const query = `INSERT INTO ${this.dbConfig.table}(${this.dbConfig.columns.data}) VALUES('${data}') RETURNING *;`;
      ((await client.query(query)) as unknown) as IMapProxyJsonDocument;
      await client.query('COMMIT');
      this.logger.log('debug', 'Transaction COMMIT called');
      this.logger.log('info', 'Successfully updated database');
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      throw new Error(`Failed to update database: ${error}`);
    } finally {
      client.release();
    }
  }

  public async getJson(): Promise<IMapProxyJsonDocument> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const query = `SELECT ${this.dbConfig.columns.data} FROM ${this.dbConfig.table} ORDER BY ${this.dbConfig.columns.updatedTime} DESC limit 1 FOR UPDATE`;
      const result = await client.query<{ data: string }>(query);
      const jsonContent = (result.rows[0].data as unknown) as IMapProxyJsonDocument;
      return jsonContent;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      throw new Error(`Failed to provied json from database: ${error}`);
    } finally {
      client.release();
    }
  }
}
