import * as supertest from 'supertest';
import { Application } from 'express';
import { container } from 'tsyringe';
import { ServerBuilder } from '../../../../src/serverBuilder';
import { ILayerPostRequest, ILayerToMosaicRequest, IUpdateMosaicRequest } from '../../../../src/common/interfaces';

let app: Application | null = null;

export function init(): void {
  const builder = container.resolve<ServerBuilder>(ServerBuilder);
  app = builder.build();
}

export async function getLayer(layerName: string): Promise<supertest.Response> {
  return supertest.agent(app).get(`/layer/${layerName}`).set('Content-Type', 'application/json');
}

export async function addLayer(layerRequest: ILayerPostRequest): Promise<supertest.Response> {
  return supertest.agent(app).post(`/layer`).set('Content-Type', 'application/json').send(layerRequest);
}

export async function updateLayer(layerName: string, layerRequest: ILayerPostRequest): Promise<supertest.Response> {
  return supertest.agent(app).put(`/layer/${layerName}`).set('Content-Type', 'application/json').send(layerRequest);
}

export async function removeLayer(layerNames: string[]): Promise<supertest.Response> {
  const queryParams = layerNames.map(layer => `layerNames=${layer}`).join('&');
  return supertest.agent(app).delete(`/layer?${queryParams}`).set('Content-Type', 'application/json');
}

export async function addLayerToMosaic(mosaicName: string, layerToMosaicRequest: ILayerToMosaicRequest): Promise<supertest.Response> {
  return supertest.agent(app).post(`/mosaic/${mosaicName}`).set('Content-Type', 'application/json').send(layerToMosaicRequest);
}

export async function updateMosaic(mosaicName: string, updateMosaicRequest: IUpdateMosaicRequest): Promise<supertest.Response> {
  return supertest.agent(app).put(`/mosaic/${mosaicName}`).set('Content-Type', 'application/json').send(updateMosaicRequest);
}
