SET search_path TO "MapproxyConfig", public;-- CHANGE SCHEMA NAME TO MATCH ENVIRONMENT
-- Table: config
-- DROP TABLE config;
CREATE TABLE config
(
    id serial PRIMARY KEY,
	data jsonb NULL,
	updated_time timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Do not forget - update the bucket-name value + endpoint_url + take the current json initial data from file mapproxy_init.json
INSERT INTO config values(DEFAULT,'/CHANGE/THIS/TO/JSON/CONTENT/FROM/mapproxy_init.json/',DEFAULT);
