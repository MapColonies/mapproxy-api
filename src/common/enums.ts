enum Providers {
  FS = 'fs',
  S3 = 's3',
  DB = 'db',
}

enum SourceTypes {
  GPKG = 'geopackage',
  S3 = 's3',
  FS = 'file',
  REDIS = 'redis',
}

const sourceTypeValues = Object.values(SourceTypes) as SourceTypes[];

const isSourceType = (value: unknown): value is SourceTypes => {
  return typeof value === 'string' && sourceTypeValues.includes(value as SourceTypes);
};

export { isSourceType, Providers, SourceTypes };
