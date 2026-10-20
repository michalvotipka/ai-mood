import type { FastifyInstance, FastifyRequest } from 'fastify';
import * as oidc from 'openid-client';
import { env } from './env.js';
import type { User } from './session.js';

type Session = FastifyRequest['session'];

// Keycloak's endpoints. The browser is sent to the public ones, this service calls the internal ones.
const internalUrl = env.KEYCLOAK_INTERNAL_URL ?? env.KEYCLOAK_URL;
const keycloak = new oidc.Configuration(
  {
    issuer: env.KEYCLOAK_URL,
    authorization_endpoint: `${env.KEYCLOAK_URL}/protocol/openid-connect/auth`,
    end_session_endpoint: `${env.KEYCLOAK_URL}/protocol/openid-connect/logout`,
    token_endpoint: `${internalUrl}/protocol/openid-connect/token`,
    jwks_uri: `${internalUrl}/protocol/openid-connect/certs`,
  },
  env.KEYCLOAK_CLIENT_ID,
  env.KEYCLOAK_CLIENT_SECRET,
);
// The internal URL is plain HTTP inside the Docker network (also in production, behind the proxy).
if (internalUrl.startsWith('http:')) oidc.allowInsecureRequests(keycloak);

const redirectUri = `${env.APP_URL}/auth/callback`;
// Refresh the access token when it expires within this time.
const REFRESH_BEFORE_MS = 30_000;

// The tokens come straight from Keycloak's token endpoint, so their content can be trusted as is.
const readUser = (accessToken: string): User => {
  const claims = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64url').toString());
  return {
    name: claims.name ?? claims.preferred_username,
    roles: claims.realm_access?.roles ?? [],
  };
};

const saveTokens = (session: Session, tokens: oidc.TokenEndpointResponse) => {
  session.tokens = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? session.tokens!.refreshToken,
    idToken: tokens.id_token ?? session.tokens!.idToken,
    expiresAt: Date.now() + (tokens.expires_in ?? 0) * 1000,
  };
  session.user = readUser(tokens.access_token);
};

// A valid access token of the signed-in user, refreshed when needed. Undefined when signed out or
// when Keycloak's session is over (refresh fails).
export const getAccessToken = async (session: Session) => {
  if (!session.tokens) return undefined;
  if (Date.now() < session.tokens.expiresAt - REFRESH_BEFORE_MS) return session.tokens.accessToken;
  try {
    saveTokens(session, await oidc.refreshTokenGrant(keycloak, session.tokens.refreshToken));
    return session.tokens.accessToken;
  } catch {
    await session.destroy();
    return undefined;
  }
};

export const authRoutes = async (app: FastifyInstance) => {
  // Sends the browser to Keycloak's login page (Authorization Code flow with PKCE).
  app.get('/auth/login', async (request, reply) => {
    const codeVerifier = oidc.randomPKCECodeVerifier();
    const state = oidc.randomState();
    request.session.login = { state, codeVerifier };

    const url = oidc.buildAuthorizationUrl(keycloak, {
      redirect_uri: redirectUri,
      scope: 'openid profile email',
      code_challenge: await oidc.calculatePKCECodeChallenge(codeVerifier),
      code_challenge_method: 'S256',
      state,
    });
    return reply.redirect(url.href);
  });

  // Keycloak returns here with a code, which is exchanged for tokens.
  app.get('/auth/callback', async (request, reply) => {
    const { login } = request.session;
    if (!login) return reply.code(400).send({ error: 'No sign-in in progress' });

    try {
      const tokens = await oidc.authorizationCodeGrant(
        keycloak,
        new URL(request.url, env.APP_URL),
        { pkceCodeVerifier: login.codeVerifier, expectedState: login.state },
      );
      // A new session ID after sign-in, so an ID planted before it can't be used (session fixation).
      await request.session.regenerate();
      saveTokens(request.session, tokens);
    } catch (err) {
      request.log.warn({ err }, 'Sign-in failed');
      return reply.code(400).send({ error: 'Sign-in failed' });
    }
    return reply.redirect('/');
  });

  app.get('/auth/me', async (request, reply) => {
    if (!(await getAccessToken(request.session)))
      return reply.code(401).send({ error: 'Not signed in' });
    return request.session.user;
  });

  // Ends this session and returns the URL of Keycloak's logout, which ends the Keycloak session too.
  app.post('/auth/logout', async (request) => {
    const idToken = request.session.tokens?.idToken;
    await request.session.destroy();
    const url = oidc.buildEndSessionUrl(keycloak, {
      post_logout_redirect_uri: `${env.APP_URL}/`,
      ...(idToken && { id_token_hint: idToken }),
    });
    return { url: url.href };
  });
};
