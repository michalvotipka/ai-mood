#!/bin/sh
# Runs once, when the db volume is empty: Keycloak's own database and user next to the app's.
set -eu

psql -v ON_ERROR_STOP=1 -v password="$KEYCLOAK_DB_PASSWORD" \
  --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<'EOSQL'
CREATE USER keycloak WITH PASSWORD :'password';
CREATE DATABASE keycloak OWNER keycloak;
EOSQL
