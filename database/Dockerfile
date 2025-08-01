FROM postgres:14-alpine

COPY schema_postgresql.sql /docker-entrypoint-initdb.d/01-schema.sql
COPY seed_postgresql.sql /docker-entrypoint-initdb.d/02-seed.sql