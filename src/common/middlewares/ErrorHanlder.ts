import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { inject, injectable } from 'tsyringe';
import { BadRequest } from 'express-openapi-validator/dist/framework/types';
import { StatusCodes } from 'http-status-codes';
import { Logger } from '@map-colonies/js-logger';
import { SERVICES } from '../constants';
import { HttpError } from '../exceptions/http/httpError';
import { ConfilctError } from '../exceptions/http/confilctError';
import { NoContentError } from '../exceptions/http/noContentError';
import { ServiceUnavailableError } from '../exceptions/http/serviceUnavailableError';

@injectable()
export class ErrorHandler {
  public constructor(@inject(SERVICES.LOGGER) private readonly logger: Logger) {}

  public getErrorHandlerMiddleware(): ErrorRequestHandler {
    return (
      err: Error,
      req: Request,
      res: Response,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      next: NextFunction
    ): void => {
      let status: number;
      let body: unknown;
      if (err instanceof BadRequest) {
        status = StatusCodes.BAD_REQUEST;
        body = {
          message: 'request validation failed',
          validationErrors: err.errors,
        };
      } else if (err instanceof ConfilctError) {
        status = err.status;
        body = {
          message: err.message,
        };
      } else if (err instanceof NoContentError) {
        status = err.status;
        body = {
          message: err.message,
        };
      } else if (err instanceof ServiceUnavailableError) {
        status = err.status;
        body = {
          message: err.message,
        };
      } else if (err instanceof HttpError) {
        status = err.status;
        body = {
          message: err.message,
        };
      } else {
        status = StatusCodes.INTERNAL_SERVER_ERROR;
        if (process.env.NODE_ENV === 'development') {
          body = {
            message: err.message,
            stack: err.stack,
          };
        } else {
          body = {
            message: 'Internal Server Error',
          };
        }
      }
      this.logger.error(`${req.method} request to ${req.originalUrl}  has failed with error: ${err.message}`);
      res.status(status).json(body);
    };
  }
}
