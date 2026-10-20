# Deployment to AWS

The whole stack runs on one EC2 server with Docker Compose (`docker-compose.prod.yml`). The server is
created by Terraform in `infra/terraform/`, its configuration lives in AWS Secrets Manager.

```
internet ─► EC2 (Elastic IP) ─► web: Caddy, HTTPS (Let's Encrypt)
                                 ├─ APP_DOMAIN:  built frontend, /auth + /api ─► bff ─► backend ─► db
                                 └─ AUTH_DOMAIN: keycloak (admin console blocked) ──────────────► db

Secrets Manager "ai-mood/prod" ─► deploy/compose.sh on the server (IAM role) ─► docker compose
```

Differences from local development:

- Images are built from `Dockerfile.prod`: no file watching, no source volumes. The frontend is a
  static build served by Caddy, with the same security headers as `vite preview`.
- Keycloak runs in production mode (`start`) and keeps its data in Postgres (its own `keycloak`
  database), so users survive restarts. `keycloak/realm.prod.json` is imported only on the first
  start: no demo users, the client secret and URLs come from the secret, self-registration is off.
- Only ports 80 and 443 are public. The Keycloak admin console is reachable only through an SSH tunnel.
- No `.env` file: passwords, keys and domains are one JSON secret in Secrets Manager. The server
  reads it through its IAM role (no access keys on the server) and passes the values to docker
  compose as environment variables. Terraform creates the secret empty, so the values never get
  into `terraform.tfstate`.

Costs: t4g.small about $13/month, the public IPv4 address about $3.6, the 20 GB disk about $2, the
secret $0.40. Terraform also creates a $10 monthly budget that sends an e-mail at 80 %.

## 1. Tools and AWS access

```bash
brew install hashicorp/tap/terraform
```

AWS CLI: the [official installer](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
(`brew install awscli` compiles from source on older macOS versions).

In the AWS console, create an IAM user for yourself (IAM → Users → Create user, policy
`AdministratorAccess`), then Security credentials → Create access key (CLI). Don't use the root
account's keys.

```bash
aws configure          # access key, secret, your region, output json
aws sts get-caller-identity
```

## 2. Create the server

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars   # your IP for SSH, e-mail for budget alerts, region
terraform init
terraform plan
terraform apply
```

The outputs print the IP, the SSH command and temporary domains on [sslip.io](https://sslip.io)
(`mood.1-2-3-4.sslip.io` resolves to `1.2.3.4`), so HTTPS works before the real domain is set up.
The first boot installs Docker and the AWS CLI and clones the repository (a few minutes):

```bash
ssh ubuntu@<ip> 'cloud-init status --wait'
```

## 3. Fill the secret

Once, from your machine:

```bash
./deploy/init-secret.sh
```

It generates the passwords and stores them with the domains in the secret, without printing them.
Then add the AI Gateway key: AWS console → Secrets Manager → `ai-mood/prod` → Retrieve secret value
→ Edit → `AI_GATEWAY_API_KEY`.

## 4. Start the stack

```bash
ssh ubuntu@<ip>
cd ai-mood
./deploy/compose.sh up -d --build
./deploy/compose.sh logs -f
```

`deploy/compose.sh` takes the same arguments as `docker compose` (`ps`, `logs`, `restart`, ...).
Caddy gets the certificates on the first request. Open `https://<APP_DOMAIN>`.

## 5. Users (Keycloak admin console)

```bash
ssh -N -L 48080:localhost:48080 ubuntu@<ip>
```

Open http://localhost:48080/admin/ and sign in as `admin` with `KEYCLOAK_ADMIN_PASSWORD` from the
secret (AWS console → Secrets Manager → `ai-mood/prod` → Retrieve secret value). Then:

1. Master realm → Users: create your own admin user with the `admin` role, and delete the temporary
   `admin` user.
2. Realm `ai-mood` → Users → Add user, then Credentials → Set password. Role mapping → `admin` for
   access to the admin section.

## 6. Updates

Push to `main`, then from your machine:

```bash
./deploy/deploy.sh <ip>
```

After changing a value in the secret, run `./deploy/compose.sh up -d` on the server: the containers
whose variables changed are recreated.

## 7. Your own domain (mood.domain.com)

1. At the DNS provider of `domain.com`, add A records for `mood` and `auth.mood`, pointing to the
   `public_ip` output.
2. In the secret, change `APP_DOMAIN` to `mood.domain.com` and `AUTH_DOMAIN` to `auth.mood.domain.com`.
3. In the admin console, realm `ai-mood` → Clients → `bff`: add `https://mood.domain.com/auth/callback`
   to Valid redirect URIs and `https://mood.domain.com/` to Valid post logout redirect URIs (the
   realm file is not imported again).
4. `./deploy/compose.sh up -d` on the server.

## Later: RDS instead of the db container

Create the RDS instance (Postgres 18) in the same VPC, allow port 5432 from the server's security
group, add `POSTGRES_HOST`/`POSTGRES_PORT` to the secret (used by the backend and Keycloak), create
the `keycloak` database and user there (see `postgres-init/`). Move the data with
`pg_dump`/`pg_restore`.

## Cleanup

```bash
cd infra/terraform && terraform destroy
```

This deletes the server including its disk, so all data with it, and the secret right away.
