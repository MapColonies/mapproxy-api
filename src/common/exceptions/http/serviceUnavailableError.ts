import HttpStatus from 'http-status-codes';
import { HttpError } from './httpError';

export class ServiceUnavailableError extends HttpError {
  public constructor(message: string);
  public constructor(error: Error, messageOverride?: string);
  public constructor(error: string | Error, messageOverride?: string) {
    if (error instanceof Error) {
      super(error, HttpStatus.SERVICE_UNAVAILABLE, messageOverride);
    } else {
      super(error, HttpStatus.SERVICE_UNAVAILABLE);
    }
  }
}
