import { Logger } from '@map-colonies/js-logger';
import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { inject, injectable, container } from 'tsyringe';
import { SERVICES } from '../constants';
import { Providers } from '../enums/providers';
import { IMapProxyConfig, IPGClient } from '../interfaces';

@injectable()
export class RollBackErrorHandler {
  private readonly pgClient: IPGClient;
  public constructor(@inject(SERVICES.LOGGER) private readonly logger: Logger, @inject(SERVICES.MAPPROXY) private readonly config: IMapProxyConfig) {
    this.pgClient = container.resolve<IPGClient>('PG');
  }

  public getRollBackHandlerMiddleware(): ErrorRequestHandler {
    return async (err: Error, req: Request, res: Response, next: NextFunction): Promise<void> => {
      if (this.config.configProvider.toLowerCase() === Providers.DB) {
        await this.rollback();
      }
      next(err);
    };
  }

  public async rollback(): Promise<void> {
    const client = await this.pgClient.getPoolConnection();
    await client.query('ROLLBACK');
    this.logger.debug('Transaction ROLLBACK called');
    client.release();
    this.logger.debug('Client RELEASED called');
  }
}
