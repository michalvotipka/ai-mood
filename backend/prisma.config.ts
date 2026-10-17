import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'prisma/config';
import { databaseUrlSchema } from './src/config/database.js';

// In docker compose the connection parameters are already in the environment. When the CLI runs
// on the host, load them from the root .env (Prisma doesn't do it itself); existing variables win.
const envFile = resolve(import.meta.dirname, '../.env');
if (existsSync(envFile)) process.loadEnvFile(envFile);

// When the parameters are missing the URL stays empty instead of throwing: `prisma generate`
// (postinstall, CI) doesn't need a database, the commands that do fail with Prisma's own error.
const databaseUrl = databaseUrlSchema.safeParse(process.env);

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: databaseUrl.data ?? '' },
});
