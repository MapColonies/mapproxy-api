import { Request, Response, NextFunction, Handler } from 'express';
import { inject, injectable } from 'tsyringe';
import { Services } from '../constants';
import { ILogger } from '../interfaces';

@injectable()
export class RequestLogger {
  public constructor(@inject(Services.LOGGER) private readonly logger: ILogger) {}

  public getLoggerMiddleware(level = 'debug'): Handler {
    return (req: Request, res: Response, next: NextFunction): void => {
      const body: string = req.body !== undefined ? JSON.stringify(req.body) : '';
      this.logger.log(level, `received ${req.method} request on ${req.originalUrl} \nbody: ${body}`);
      return next();
    };
  }
}
