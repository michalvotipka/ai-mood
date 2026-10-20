#!/bin/bash
# Fills the app's secret in AWS Secrets Manager, once, from your machine: ./deploy/init-secret.sh
# Generates the passwords (they're never printed), takes the domains, region and secret name from
# `terraform output`. AI_GATEWAY_API_KEY stays empty: set it in the AWS console afterwards.
set -euo pipefail
cd "$(dirname "$0")/../infra/terraform"

region=$(terraform output -raw region)
secret_id=$(terraform output -raw secret_name)

if aws secretsmanager get-secret-value --region "$region" --secret-id "$secret_id" \
  --query VersionId --output text >/dev/null 2>&1; then
  echo "$secret_id already has a value, edit it in the AWS console instead." >&2
  exit 1
fi

generate() { openssl rand -base64 48 | tr -d '/+=\n'; }

jq -n \
  --arg app_domain "$(terraform output -raw app_domain)" \
  --arg auth_domain "$(terraform output -raw auth_domain)" \
  --arg postgres_password "$(generate)" \
  --arg keycloak_db_password "$(generate)" \
  --arg keycloak_admin_password "$(generate)" \
  --arg keycloak_client_secret "$(generate)" \
  --arg session_secret "$(generate)" \
  '{
    APP_DOMAIN: $app_domain,
    AUTH_DOMAIN: $auth_domain,
    AI_GATEWAY_API_KEY: "",
    AI_MODEL: "google/gemini-2.5-flash-lite",
    AI_OCR_MODEL: "google/gemini-2.5-flash",
    POSTGRES_USER: "aimood",
    POSTGRES_PASSWORD: $postgres_password,
    POSTGRES_DB: "aimood",
    KEYCLOAK_DB_PASSWORD: $keycloak_db_password,
    KEYCLOAK_ADMIN_PASSWORD: $keycloak_admin_password,
    KEYCLOAK_CLIENT_SECRET: $keycloak_client_secret,
    SESSION_SECRET: $session_secret
  }' |
  aws secretsmanager put-secret-value --region "$region" --secret-id "$secret_id" \
    --secret-string file:///dev/stdin --query Name --output text

echo "Done. Now set AI_GATEWAY_API_KEY: AWS console → Secrets Manager → $secret_id → Retrieve secret value → Edit."
