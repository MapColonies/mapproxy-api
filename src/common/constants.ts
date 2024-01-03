import { readPackageJsonSync } from '@map-colonies/read-pkg';

export const SERVICE_NAME = readPackageJsonSync().name ?? 'unknown_service';
export const DEFAULT_SERVER_PORT = 80;

export const IGNORED_OUTGOING_TRACE_ROUTES = [/^.*\/v1\/metrics.*$/];
export const IGNORED_INCOMING_TRACE_ROUTES = [/^.*\/docs.*$/];

/* eslint-disable @typescript-eslint/naming-convention */
export const SERVICES: Record<string, symbol> = {
  LOGGER: Symbol('Logger'),
  CONFIG: Symbol('Config'),
  TRACER: Symbol('Tracer'),
  METER: Symbol('Meter'),
  MAPPROXY: Symbol('MapProxyConfig'),
  REDISCONFIG: Symbol('RedisConfig'),
  CONFIGPROVIDER: Symbol('ConfigProvider'),
  FS: Symbol('FS'),
  S3: Symbol('S3'),
  PG: Symbol('PG'),
};
/* eslint-enable @typescript-eslint/naming-convention */
