/* eslint-disable import/first */
// this import must be called before the first import of tsyring
import 'reflect-metadata';
import { createServer } from 'http';
import { createTerminus } from '@godaddy/terminus';
import type { Logger } from '@map-colonies/js-logger';
import { getApp } from './app';
import type { ConfigType } from './common/config';
import { SERVICES } from './common/constants';

void getApp()
  .then(([app, container]) => {
    const logger = container.resolve<Logger>(SERVICES.LOGGER);
    const config = container.resolve<ConfigType>(SERVICES.CONFIG);

    const port = config.get('server.port') as unknown as number;
    const stubHealthCheck = async (): Promise<void> => Promise.resolve();

    const server = createTerminus(createServer(app), { healthChecks: { '/liveness': stubHealthCheck }, onSignal: container.resolve('onSignal') });

    server.listen(port, () => {
      logger.info(`app started on port ${port}`);
    });
  })
  .catch((error: Error) => {
    console.error('😢 - failed initializing the server');
    console.error(error);
    process.exit(1);
  });
