import { api } from './client';

export type User = {
  name: string;
  roles: string[];
};

// Signed-out users never get the result: the client sends them to the login page instead.
export const getCurrentUser = async () => (await api.get<User>('/me', { baseURL: '/auth' })).data;

// Ends the session in the BFF, then leaves for Keycloak's logout, which comes back to the app.
export const signOut = async () => {
  const { data } = await api.post<{ url: string }>('/logout', null, { baseURL: '/auth' });
  window.location.assign(data.url);
};
