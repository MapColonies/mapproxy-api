import { container } from 'tsyringe';
import { Application } from 'express';
import { registerExternalValues } from './containerConfig';
import { ServerBuilder } from './serverBuilder';

function getApp(): Application {
  registerExternalValues();
  const app = container.resolve(ServerBuilder).build();
  return app;
}

export { getApp };
