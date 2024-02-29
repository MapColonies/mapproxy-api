import * as supertest from 'supertest';
import { ILayerPostRequest } from '../../../../src/common/interfaces';

export class LayersRequestSender {
  public constructor(private readonly app: Express.Application) {}

  public async getLayersCache(cacheName: string, cacheType: string): Promise<supertest.Response> {
    return supertest.agent(this.app).get(`/layer/${cacheName}/${cacheType}`).set('Content-Type', 'application/json');
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
}
