import * as supertest from 'supertest';
import { Application } from 'express';

import { container } from 'tsyringe';
import { ServerBuilder } from '../../../../src/serverBuilder';

let app: Application | null = null;

export function init(): void {
  const builder = container.resolve<ServerBuilder>(ServerBuilder);
  app = builder.build();
}

export async function getLayer(layerName: string): Promise<supertest.Response> {
  return supertest.agent(app).get(`/layer/${layerName}`).set('Content-Type', 'application/json');
}
