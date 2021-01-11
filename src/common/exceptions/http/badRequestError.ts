import HttpStatus from 'http-status-codes';
import { HttpError } from './httpError';

export class BadRequestError extends HttpError {
  public constructor(message: string);
  public constructor(error: Error, messageOverride?: string);
  public constructor(error: string | Error, messageOverride?: string) {
    if (error instanceof Error) {
      super(error, HttpStatus.BAD_REQUEST, messageOverride);
    } else {
      super(error, HttpStatus.BAD_REQUEST);
    }
  }
}
