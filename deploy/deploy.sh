#!/bin/sh
# Deploys the pushed main branch: ./deploy/deploy.sh <server IP>
# Pulls on the server, rebuilds the changed images and restarts what changed.
set -eu

host="${1:?usage: deploy/deploy.sh <server IP>}"

ssh "ubuntu@$host" '
  set -eu
  cd ai-mood
  git pull --ff-only
  docker compose -f docker-compose.prod.yml up -d --build --remove-orphans
  docker image prune -f
  docker compose -f docker-compose.prod.yml ps
'
