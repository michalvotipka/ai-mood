import axios from 'axios';

// Requests go to the BFF on the app's own origin. It knows the user from the httpOnly session
// cookie and forwards /api to the backend with the access token. No token is ever visible here.
export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    // Required by the BFF on anything but GET (CSRF protection).
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// Signed out, or the session expired: sign in on Keycloak's login page, which returns to the app.
api.interceptors.response.use(undefined, (err) => {
  if (axios.isAxiosError(err) && err.response?.status === 401) {
    window.location.assign('/auth/login');
    // The page is leaving, so the request never settles.
    return new Promise(() => {});
  }
  throw err;
});

export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError<{ error?: string }>(err)) {
    return err.response?.data?.error ?? err.message;
  }
  return err instanceof Error ? err.message : String(err);
}
