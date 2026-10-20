# Deployment to AWS

The whole stack runs on one EC2 server with Docker Compose (`docker-compose.prod.yml`). The server is
created by Terraform in `infra/terraform/`.

```
internet ─► EC2 (Elastic IP) ─► web: Caddy, HTTPS (Let's Encrypt)
                                 ├─ APP_DOMAIN:  built frontend, /auth + /api ─► bff ─► backend ─► db
                                 └─ AUTH_DOMAIN: keycloak (admin console blocked) ──────────────► db
```

Differences from local development:

- Images are built from `Dockerfile.prod`: no file watching, no source volumes. The frontend is a
  static build served by Caddy, with the same security headers as `vite preview`.
- Keycloak runs in production mode (`start`) and keeps its data in Postgres (its own `keycloak`
  database), so users survive restarts. `keycloak/realm.prod.json` is imported only on the first
  start: no demo users, the client secret and URLs come from `.env`, self-registration is off.
- Only ports 80 and 443 are public. The Keycloak admin console is reachable only through an SSH tunnel.

Costs (eu-central-1): t4g.small about $13/month, the public IPv4 address about $3.6, the 20 GB disk
about $2. Terraform also creates a $10 monthly budget that sends an e-mail at 80 %.

## 1. Tools and AWS access

```bash
brew install awscli hashicorp/tap/terraform
```

In the AWS console, create an IAM user for yourself (IAM → Users → Create user, policy
`AdministratorAccess`), then Security credentials → Create access key (CLI). Don't use the root
account's keys.

```bash
aws configure          # access key, secret, region eu-central-1, output json
aws sts get-caller-identity
```

## 2. Create the server

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars   # your IP for SSH, e-mail for budget alerts
terraform init
terraform plan
terraform apply
```

The outputs print the IP, the SSH command and temporary domains on [sslip.io](https://sslip.io)
(`mood.1-2-3-4.sslip.io` resolves to `1.2.3.4`), so HTTPS works before the real domain is set up.
The first boot installs Docker and clones the repository (a few minutes):

```bash
ssh ubuntu@<ip> 'cloud-init status --wait'
```

## 3. Start the stack

```bash
ssh ubuntu@<ip>
cd ai-mood
cp deploy/prod.env.example .env
nano .env    # domains from terraform output, secrets: openssl rand -base64 48 | tr -d '/+='
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml logs -f
```

Caddy gets the certificates on the first request. Open `https://<APP_DOMAIN>`.

## 4. Users (Keycloak admin console)

```bash
ssh -N -L 48080:localhost:48080 ubuntu@<ip>
```

Open http://localhost:48080/admin/ and sign in as `admin` with `KEYCLOAK_ADMIN_PASSWORD`. Then:

1. Master realm → Users: create your own admin user with the `admin` role, and delete the temporary
   `admin` user.
2. Realm `ai-mood` → Users → Add user, then Credentials → Set password. Role mapping → `admin` for
   access to the admin section.

## 5. Updates

Push to `main`, then from your machine:

```bash
./deploy/deploy.sh <ip>
```

## 6. Your own domain (mood.domain.com)

1. At the DNS provider of `domain.com`, add A records for `mood` and `auth.mood`, pointing to the
   `public_ip` output.
2. On the server, change `.env`: `APP_DOMAIN=mood.domain.com`, `AUTH_DOMAIN=auth.mood.domain.com`.
3. In the admin console, realm `ai-mood` → Clients → `bff`: add `https://mood.domain.com/auth/callback`
   to Valid redirect URIs and `https://mood.domain.com/` to Valid post logout redirect URIs (the
   realm file is not imported again).
4. `docker compose -f docker-compose.prod.yml up -d`

## Later: RDS instead of the db container

Create the RDS instance (Postgres 18) in the same VPC, allow port 5432 from the server's security
group, set `POSTGRES_HOST`/`POSTGRES_PORT` in `.env` (used by the backend and Keycloak), create the
`keycloak` database and user there (see `postgres-init/`). Move the data with `pg_dump`/`pg_restore`.

## Cleanup

```bash
cd infra/terraform && terraform destroy
```

This deletes the server including its disk, so all data with it.
