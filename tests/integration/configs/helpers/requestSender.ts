import * as supertest from 'supertest';

export class ConfigsRequestSender {
  public constructor(private readonly app: Express.Application) {}

  public async getConfig(): Promise<supertest.Response> {
    return supertest.agent(this.app).get(`/config`).set('accept', 'application/json');
  }

  public async getConfigYaml(): Promise<supertest.Response> {
    return supertest.agent(this.app).get(`/config`).set('accept', 'application/yaml');
  }
}
