import { Application } from 'express';
import { registerExternalValues, RegisterOptions } from './containerConfig';
import { ServerBuilder } from './serverBuilder';

function getApp(registerOptions?: RegisterOptions): Application {
  const container = registerExternalValues(registerOptions);
  const app = container.resolve(ServerBuilder).build();
  return app;
}

export { getApp };
