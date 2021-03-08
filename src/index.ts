// this import must be called before the first import of tsyring
import 'reflect-metadata';
import { Probe } from '@map-colonies/mc-probe';
import { container } from 'tsyringe';
import { get } from 'config';
import { initConfig } from './initConfig';
import { getApp } from './app';
import { DEFAULT_SERVER_PORT } from './common/constants';
import { IMapProxyConfig } from './common/interfaces';

interface IServerConfig {
  port: string;
}

const mapproxyConfig = get<IMapProxyConfig>('mapproxy');
const serverConfig = get<IServerConfig>('server');
const port: number = parseInt(serverConfig.port) || DEFAULT_SERVER_PORT;
const app = getApp();
initConfig(mapproxyConfig);
const probe = container.resolve<Probe>(Probe);
void probe.start(app, port).then(() => {
  probe.readyFlag = true;
});
