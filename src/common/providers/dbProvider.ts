import { readFileSync } from 'fs';
import { Logger } from '@map-colonies/js-logger';
import { Pool, PoolClient, PoolConfig } from 'pg';
import { container } from 'tsyringe';
import { SERVICES } from '../constants';
import { IConfigProvider, IDBConfig, IConfig, IMapProxyJsonDocument } from '../interfaces';

export class DBProvider implements IConfigProvider {
  private readonly config: IConfig;
  private readonly dbConfig: IDBConfig;
  private readonly logger: Logger;
  private readonly pool: Pool;
  public constructor() {
    this.logger = container.resolve(SERVICES.LOGGER);
    this.config = container.resolve(SERVICES.CONFIG);
    const config: IConfig = container.resolve(SERVICES.CONFIG);
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

  public async updateJson(editJson: (content: IMapProxyJsonDocument) => IMapProxyJsonDocument): Promise<void> {
    const client = await this.connectToDb();
    let reThrow = false;
    try {
      await client.query('BEGIN');
      let query = `SELECT ${this.dbConfig.columns.data} FROM ${this.dbConfig.table} ORDER BY ${this.dbConfig.columns.updatedTime} DESC limit 1 FOR UPDATE`;
      const result = await client.query<{ data: string }>(query);
      const jsonContent = result.rows[0].data as unknown as IMapProxyJsonDocument;
      let rawData: IMapProxyJsonDocument;
      try {
        rawData = editJson(jsonContent);
      } catch (err) {
        reThrow = true;
        throw err;
      }
      const data = JSON.stringify(rawData);
      query = `INSERT INTO ${this.dbConfig.table}(${this.dbConfig.columns.data}) VALUES('${data}') RETURNING *;`;
      (await client.query(query)) as unknown as IMapProxyJsonDocument;
      await client.query('COMMIT');
      this.logger.debug('Transaction COMMIT called');
      this.logger.info('Successfully updated database');
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unnecessary-condition
      throw reThrow ? error : new Error(`Failed to update database: ${error}`);
    } finally {
      client.release();
    }
  }

  public async getJson(): Promise<IMapProxyJsonDocument> {
    const client = await this.connectToDb();
    try {
      const query = `SELECT ${this.dbConfig.columns.data} FROM ${this.dbConfig.table} ORDER BY ${this.dbConfig.columns.updatedTime} DESC limit 1`;
      const result = await client.query<{ data: string }>(query);
      const jsonContent = result.rows[0].data as unknown as IMapProxyJsonDocument;
      return jsonContent;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      throw new Error(`Failed to provied json from database: ${error}`);
    } finally {
      client.release();
    }
  }

  private async connectToDb(): Promise<PoolClient> {
    const pgClient = await this.pool.connect();
    await pgClient.query(`SET search_path TO "${this.dbConfig.schema}",public`);
    return pgClient;
  }
}
