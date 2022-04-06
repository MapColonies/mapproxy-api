import * as supertest from 'supertest';
import { Application } from 'express';
import { container } from 'tsyringe';
import { ServerBuilder } from '../../../../src/serverBuilder';
import { ILayerPostRequest, ILayerToMosaicRequest, IUpdateMosaicRequest } from '../../../../src/common/interfaces';

export class layersRequestSender {
  public constructor(private readonly app: Express.Application) {}

  public init(): void {
    const builder = container.resolve<ServerBuilder>(ServerBuilder);
  }

  public async getLayer(layerName: string): Promise<supertest.Response> {
    return supertest.agent(this.app).get(`/layer/${layerName}`).set('Content-Type', 'application/json');
  }

  public async addLayer(layerRequest: ILayerPostRequest): Promise<supertest.Response> {
    return supertest.agent(this.app).post(`/layer`).set('Content-Type', 'application/json').send(layerRequest);
  }

  public async updateLayer(layerName: string, layerRequest: ILayerPostRequest): Promise<supertest.Response> {
    return supertest.agent(this.app).put(`/layer/${layerName}`).set('Content-Type', 'application/json').send(layerRequest);
  }

  public async removeLayer(layerNames: string[]): Promise<supertest.Response> {
    const queryParams = layerNames.map((layer) => `layerNames=${layer}`).join('&');
    return supertest.agent(this.app).delete(`/layer?${queryParams}`).set('Content-Type', 'application/json');
  }

  public async addLayerToMosaic(mosaicName: string, layerToMosaicRequest: ILayerToMosaicRequest): Promise<supertest.Response> {
    return supertest.agent(this.app).post(`/mosaic/${mosaicName}`).set('Content-Type', 'application/json').send(layerToMosaicRequest);
  }

  public async updateMosaic(mosaicName: string, updateMosaicRequest: IUpdateMosaicRequest): Promise<supertest.Response> {
    return supertest.agent(this.app).put(`/mosaic/${mosaicName}`).set('Content-Type', 'application/json').send(updateMosaicRequest);
  }
}
