import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError<{ error?: string }>(err)) {
    return err.response?.data?.error ?? err.message;
  }
  return err instanceof Error ? err.message : String(err);
}
