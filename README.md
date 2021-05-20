# Map Colonies - MapProxy API Service

This is an API service to manage layers provided by [MapProxy](https://mapproxy.org/) 



### Uasage:

1. `git clone https://github.com/MapColonies/mapproxy-api.git`.
2. run `npm install`.
3. set service configurations - **see below**
4. run `npm run start`.
5. open browser in `http://localhost:{port}/docs/api` for swagger ui

## Docker Usage

*for docker usage run `docker build` to build the image from the Dockerfile and use the below configuration with `-e` flag when running the image (`docker run -e ENV=VALUE)*

- after running docker container, open browser in `http://localhost:{port}/docs/api` for swagger ui

## Configuration

`SERVER_PORT` to set port number - *deafult to 8080*

`LOG_LEVEL` set the log level *based on 'winston' logger, available values as declared in [winston logger docs](https://github.com/winstonjs/winston), *default to 'info'*

`MAPPROXY_FILE_PROVIDER` can be set to 'fs' or 's3', determined where the mapproxy.yaml file is stored, **if set to 'fs'** - changes will apply directly 
to yaml file that declared in `MAPPROXY_YAML_FILEPATH` , **if set to 's3'** -  changes will directly apply to yaml file that declared in `MAPPROXY_YAML_FILEPATH` and will upload updated yaml file to the configured s3 bucket (see below), *deafult to fs*, create file if not exists.

`MAPPROXY_CACHE_GRIDS` set the requested grid name according environment, **default configuration file created with 'epsg4326ul' (gpkg grid) and 'epsg4326ll' (s3 cache directory grid)**, `you can provide multiple grids with seperated by ","(comma)` **example: MAPPROXY_CACHE_GRIDS="epsg4326ul,epsg4326ll"**, *default to epsg4326ul*

`MAPPROXY_CACHE_REQUEST_FORMAT` set the requested format, available values: 'image/png', 'image/jpeg', *deafult to image/png*

`MAPPROXY_CACHE_UPSCALE_TILES` determine zoom level for upscale missing tiles

*S3 Object Storage Configuration*

***if `MAPPROXY_FILE_PROVIDER` is set to 's3' make sure to declare next configuration***

`AWS_ACCESS_KEY_ID` AWS access key, *default to 'minioadmin'*

`AWS_SECRET_ACCESS_KEY` AWS secret access key, *default to 'minioadmin'*

`S3_ENDPOINT_URL` AWS endpoint URL, *default to 'http://localhost:9000'*

`S3_BUCKET` AWS bucket name - **STORED TILES BUCKET**

`S3_CONFIG_FILE_BUCKET` AWS bucket name - **STORED YAML FILE BUCKET**

`SSL_ENABLED` AWSenable SSL, *deafult to 'false'*
