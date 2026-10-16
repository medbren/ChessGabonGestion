export const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const AUTH_TOKEN_KEY = 'token';
export const AUTH_USER_KEY = 'user';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!raw || raw === 'undefined' || raw === 'null') return null;
  return raw;
}

export function getStoredUser<T = unknown>(): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Extrait le JWT quelle que soit la forme de la réponse backend. */
export function extractAccessToken(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  const candidates = [
    d.accessToken,
    d.access_token,
    d.token,
    (d.data as Record<string, unknown> | undefined)?.accessToken,
    (d.data as Record<string, unknown> | undefined)?.access_token,
    (d.data as Record<string, unknown> | undefined)?.token,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.length > 0) return c;
  }
  return null;
}

export function setSession(token: string, user?: unknown): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  if (user !== undefined) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  }
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function authHeaders(
  extra: Record<string, string> = {}
): Record<string, string> {
  const token = getToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers: Record<string, string> = {
    ...authHeaders(),
    ...(options.headers as Record<string, string> | undefined),
  };

  if (
    options.body &&
    typeof options.body === 'string' &&
    !headers['Content-Type']
  ) {
    headers['Content-Type'] = 'application/json';
  }

  return fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });
}
