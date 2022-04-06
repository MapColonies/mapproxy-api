import { Logger } from '@map-colonies/js-logger';
import { Request, Response, NextFunction, Handler } from 'express';
import { inject, injectable } from 'tsyringe';
import { SERVICES } from '../constants';

@injectable()
export class RequestLogger {
  public constructor(@inject(SERVICES.LOGGER) private readonly logger: Logger) {}

  public getLoggerMiddleware(): Handler {
    return (req: Request, res: Response, next: NextFunction): void => {
      const body: string = req.body !== undefined ? JSON.stringify(req.body) : '';
      this.logger.debug(`received ${req.method} request on ${req.originalUrl} \nbody: ${body}`);
      return next();
    };
  }
}
