import fp from 'fastify-plugin';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { env } from '../config/env.js';

export type AuthUser = {
  // Keycloak user ID.
  sub: string;
  name: string | undefined;
  // Realm roles, e.g. `admin`.
  roles: string[];
};

declare module 'fastify' {
  interface FastifyRequest {
    user: AuthUser;
  }
}

// Keycloak's public signing keys, downloaded on first use and cached.
const jwks = createRemoteJWKSet(new URL(env.OIDC_JWKS_URL));

// Every route registered after this plugin requires `Authorization: Bearer <access token>`, issued
// by our Keycloak realm for the backend (audience), signed and not expired.
export const authentication = fp(async (app) => {
  app.decorateRequest('user', null as unknown as AuthUser);

  app.addHook('onRequest', async (request) => {
    const token = request.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
    if (!token) throw app.httpErrors.unauthorized('Missing access token');

    const { payload } = await jwtVerify(token, jwks, {
      issuer: env.OIDC_ISSUER_URL,
      audience: env.OIDC_AUDIENCE,
    }).catch(() => {
      throw app.httpErrors.unauthorized('Invalid access token');
    });

    const realmAccess = payload.realm_access as { roles?: string[] } | undefined;
    request.user = {
      sub: payload.sub!,
      name: (payload.name ?? payload.preferred_username) as string | undefined,
      roles: realmAccess?.roles ?? [],
    };
  });
});
