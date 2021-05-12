/* eslint-disable @typescript-eslint/naming-convention */
import { SourceTypes } from './enums/sourceTypes';
import { DependencyContainer } from 'tsyringe';
import { Services } from './constants';
import { ICacheProvider, ICacheSource, ILogger, IMapProxyConfig, IS3Source } from './interfaces';

export class S3Source implements ICacheProvider {
  private readonly mapproxyConfig: IMapProxyConfig;
  private readonly logger: ILogger;

  public constructor(container: DependencyContainer) {
    this.logger = container.resolve(Services.LOGGER);
    this.mapproxyConfig = container.resolve(Services.MAPPROXY);
  }

  public getCacheSource(sourcePath: string): IS3Source {
    const s3Source: IS3Source = {
      type: SourceTypes.S3,
      directory: sourcePath,
      directory_layout: this.mapproxyConfig.cache.directoryLayout
    }

    return s3Source;
  }
};