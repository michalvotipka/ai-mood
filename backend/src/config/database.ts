import { z } from 'zod';

// Connection parameters use the names of the official postgres Docker image, so the db service
// and the backend read the same variables. All of them come from .env, there are no defaults.
const databaseEnvSchema = z.object({
  POSTGRES_HOST: z.string().trim().min(1),
  POSTGRES_PORT: z.coerce.number().int().positive(),
  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(1),
  POSTGRES_DB: z.string().min(1),
});

type DatabaseEnv = z.infer<typeof databaseEnvSchema>;

// The only place where the connection string is put together. Credentials and the database name
// are URL-encoded, so the password may contain any characters (@, :, /, # …).
const buildDatabaseUrl = ({
  POSTGRES_HOST,
  POSTGRES_PORT,
  POSTGRES_USER,
  POSTGRES_PASSWORD,
  POSTGRES_DB,
}: DatabaseEnv) => {
  const user = encodeURIComponent(POSTGRES_USER);
  const password = encodeURIComponent(POSTGRES_PASSWORD);
  const database = encodeURIComponent(POSTGRES_DB);
  return `postgresql://${user}:${password}@${POSTGRES_HOST}:${POSTGRES_PORT}/${database}`;
};

export const databaseUrlSchema = databaseEnvSchema.transform(buildDatabaseUrl);
