# Map Colonies - MapProxy API Service

This is an API service to manage layers provided by [MapProxy](https://mapproxy.org/) 



### Uasage:

1. `git clone https://github.com/MapColonies/mapproxy-api.git`.
2. run `npm install`.
3. set service configurations - **see below**
4. run `npm run start`.
5. open browser in `http://localhost:{port}/docs/api` for swagger ui



<br>

---

<br>

## Docker Usage

build the image: 
(from root)

```
 docker build --no-cache -t mapproxy-api:latest . 
```

run the image:

```
docker run mapproxy-api:latest
```

if you wishes to declare envs run:

```
docker run -e ENV=VALUE mapproxy-api:latest
```


- after running docker container, open browser in `http://localhost:{port}/docs/api` for swagger ui

## Configuration

`SERVER_PORT` set the server port number - *deafult to 8080*

`LOG_LEVEL` set the log level *based on 'winston' logger, available values as declared in [winston logger docs](https://github.com/winstonjs/winston), *default to 'info'*

`MAPPROXY_FILE_PROVIDER` **available values: 'fs', 's3' or 'db'.**

 determined where the mapproxy.yaml file is stored.
 
  **if set to 'fs'** - changes will apply directly 
to yaml file that declared in `MAPPROXY_YAML_FILEPATH`.

 **if set to 's3'** -  changes will directly apply to yaml file that is stored in s3 defined bucket.

 **if set to 'db'** - changes will directly apply to the database.
*deafult to fs*

`MAPPROXY_CACHE_GRIDS` set the requested grid name according environment.

 you can provide multiple grids with seperated by ","(comma)`

**example: MAPPROXY_CACHE_GRIDS="epsg4326ul,epsg4326ll"**, *default to 'epsg4326ul'*

`MAPPROXY_CACHE_REQUEST_FORMAT` set the requested format.

 available values: 'image/png', 'image/jpeg', *deafult to image/png*

`MAPPROXY_CACHE_UPSCALE_TILES` determine zoom level for upscale missing tiles

<br>
<br>

**FS Configuration**

***
if `MAPPROXY_FILE_PROVIDER` is set to 'fs' make sure to declare next envs
***

`MAPPROXY_YAML_FILE_PATH` set the path to the 'mapproxy.yaml' yaml file, no default value.


<br>
<br>

**S3 Object Storage Configuration**

***
if `MAPPROXY_FILE_PROVIDER` is set to 's3' make sure to declare next envs
***

`AWS_ACCESS_KEY_ID` AWS access key, *default to 'minioadmin'*

`AWS_SECRET_ACCESS_KEY` AWS secret access key, *default to 'minioadmin'*

`AWS_ENDPOINT_URL` AWS endpoint URL, *default to 'http://localhost:9000'*

`AWS_BUCKET` AWS bucket name, no default value

`AWS_SSL_ENABLED` AWS enable SSL, *deafult to 'false'*


<br>
<br>

**DB Configuration**

***
if `MAPPROXY_FILE_PROVIDER` is set to 'db' make sure to declare next envs
****

`DB_HOST` set the server host , deafult to 'localhost'

`DB_USER` set the database username, default to 'postgres'

`DB_PASSWORD` set the database password, default to 'postgres'

`DB_DATABASE` set the database name, *no default value*

`DB_SSL_ENABLE` set to true if you wished to use database ssl.
default  to false

`DB_SSL_REJECT_UNAUTHORIZED` if true, the server certificate is verified against the list of supplied CAs

`DB_SSL_CA` set the path to the CA file

`DB_SSL_KEY` set the path to the KEY file

`DB_SSL_CERT` set the path to the CERT file
