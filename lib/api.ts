import axios from 'axios';

/** One axios client pointing to Next.js /api. */
export const api = axios.create({ baseURL: '/api' });

const TOKEN_KEY = 'globetrotter.token';

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token: string | null) => {
  if (typeof window === 'undefined') return;
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* private browsing */
  }
};

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Turn any failure into the sentence the interface should show. */
export function errorText(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (err.response?.data?.error) return err.response.data.error as string;
    if (err.code === 'ERR_NETWORK') return 'The server is not responding.';
  }
  return 'Something went wrong. Try that again.';
}
