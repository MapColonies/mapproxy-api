-- Table: public.config
-- DROP TABLE public.config;
CREATE TABLE public.config
(
    id serial PRIMARY KEY,
	data jsonb NULL,
	updated_time timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);
