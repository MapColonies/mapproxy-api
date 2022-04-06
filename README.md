# Map Colonies typescript service template

----------------------------------

![badge-alerts-lgtm](https://img.shields.io/lgtm/alerts/github/MapColonies/ts-server-boilerplate?style=for-the-badge)

![grade-badge-lgtm](https://img.shields.io/lgtm/grade/javascript/github/MapColonies/ts-server-boilerplate?style=for-the-badge)

![snyk](https://img.shields.io/snyk/vulnerabilities/github/MapColonies/ts-server-boilerplate?style=for-the-badge)

----------------------------------

This is a basic repo template for building new MapColonies web services in Typescript.

### Template Features:

- eslint configuration by [@map-colonies/eslint-config](https://github.com/MapColonies/eslint-config)

- prettier configuration by [@map-colonies/prettier-config](https://github.com/MapColonies/prettier-config)

- jest

- .nvmrc

- Multi stage producton-ready Dockerfile

- commitlint

- git hooks

- logging by [@map-colonies/js-logger](https://github.com/MapColonies/js-logger)

- OpenAPI request validation

- config load with [node-config](https://www.npmjs.com/package/node-config)

- Tracing and metrics by [@map-colonies/telemetry](https://github.com/MapColonies/telemetry)

- github templates

- bug report

- feature request

- pull request

- github actions

- on pull_request

- LGTM

- test

- lint

- snyk

## API
Checkout the OpenAPI spec [here](/openapi3.yaml)

## Installation

Install deps with npm

```bash
npm install
```
### Install Git Hooks
```bash
npx husky install
```

## Run Locally

Clone the project

```bash

git clone https://link-to-project

```

Go to the project directory

```bash

cd my-project

```

Install dependencies

```bash

npm install

```

Start the server

```bash

npm run start

```

## Running Tests

To run tests, run the following command

```bash

npm run test

```

To only run unit tests:
```bash
npm run test:unit
```

To only run integration tests:
```bash
npm run test:integration
```
