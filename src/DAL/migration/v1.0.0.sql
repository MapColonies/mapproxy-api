SET SCHEMA 'public'; -- CHANGE SCHEMA NAME TO MATCH ENVIRONMENT
-- Table: config
-- DROP TABLE config;
CREATE TABLE config
(
    id serial PRIMARY KEY,
	data jsonb NULL,
	updated_time timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);
