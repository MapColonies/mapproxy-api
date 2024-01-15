import path from 'node:path';
import jestOpenApi from 'jest-openapi';

jestOpenApi(path.join(process.cwd(), 'openapi3.yaml'));
