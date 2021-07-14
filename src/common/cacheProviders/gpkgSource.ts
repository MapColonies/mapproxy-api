/* eslint-disable @typescript-eslint/naming-convention */
import { parse } from 'path';
import { SourceTypes } from '../enums/sourceTypes';
import { ICacheProvider, IGpkgSource } from '../interfaces';

class GpkgSource implements ICacheProvider {
  public getCacheSource(sourcePath: string): IGpkgSource {
    const fileBasename = parse(sourcePath).name;

    const gpkgSource: IGpkgSource = {
      type: SourceTypes.GPKG,
      filename: sourcePath,
      table_name: fileBasename,
    };

    return gpkgSource;
  }
}

export { GpkgSource };
