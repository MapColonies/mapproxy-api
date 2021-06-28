import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { inject, injectable, container } from 'tsyringe';
import { Services } from '../constants';
import { Providers } from '../enums/providers';
import { ILogger, IMapProxyConfig, IPGClient } from '../interfaces';

@injectable()
export class RollBackErrorHandler {
  private readonly pgClient: IPGClient;
  public constructor(@inject(Services.LOGGER) private readonly logger: ILogger, @inject(Services.MAPPROXY) private readonly config: IMapProxyConfig) {
    this.pgClient = container.resolve<IPGClient>('PG');
  }

  public getRollBackHandlerMiddleware(): ErrorRequestHandler {
    return async (err: Error, req: Request, res: Response, next: NextFunction): Promise<void> => {
      if (this.config.fileProvider.toLowerCase() === Providers.DB) {
        await this.rollback();
      }
      next(err);
    };
  }

  public async rollback(): Promise<void> {
    const client = await this.pgClient.getPoolConnection();
    await client.query('ROLLBACK');
    this.logger.log('debug', 'Transaction ROLLBACK called');
    client.release();
    this.logger.log('debug', 'Client RELEASED called');
  }
}
