import HttpStatus from 'http-status-codes';
import { HttpError } from './httpError';

export class InternalServerError extends HttpError {
  public constructor(message: string);
  public constructor(error: Error, messageOverride?: string);
  public constructor(error: string | Error, messageOverride?: string) {
    if (error instanceof Error) {
      super(error, HttpStatus.INTERNAL_SERVER_ERROR, messageOverride);
    } else {
      super(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
