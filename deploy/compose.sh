#!/bin/bash
# docker compose for the production stack, on the server, e.g.:
#   ./deploy/compose.sh up -d --build
#   ./deploy/compose.sh logs -f backend
# Its variables come from the AWS Secrets Manager secret (read through the server's IAM role) and
# reach docker compose as environment variables, never as a file.
set -euo pipefail
cd "$(dirname "$0")/.."

secret_id="${SECRET_ID:-ai-mood/prod}"

# The server's region, from the instance metadata (IMDSv2).
imds_token=$(curl -fsS -X PUT http://169.254.169.254/latest/api/token \
  -H 'X-aws-ec2-metadata-token-ttl-seconds: 60')
region=$(curl -fsS -H "X-aws-ec2-metadata-token: $imds_token" \
  http://169.254.169.254/latest/meta-data/placement/region)

secret=$(aws secretsmanager get-secret-value --region "$region" --secret-id "$secret_id" \
  --query SecretString --output text)

# Every key of the JSON secret becomes an environment variable.
while IFS= read -r variable; do
  export "$variable"
done < <(jq -r 'to_entries[] | "\(.key)=\(.value)"' <<<"$secret")

exec docker compose -f docker-compose.prod.yml "$@"
