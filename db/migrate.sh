#!/bin/sh
migrate -path ./scripts -database "$DB_CONN?x-migrations-table=schema_migrations_lockerhub_db" up

