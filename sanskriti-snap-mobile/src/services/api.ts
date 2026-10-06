import { queryClient } from './offline';

export type TokenProvider = () => Promise<string | null>;

let tokenProvider: TokenProvider = async () => null;

function getApiUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
  if (!url) {
    throw new Error('EXPO_PUBLIC_API_URL is not configured. Set it to the backend origin.');
  }
  return url;
}

export function configureApiTokenProvider(provider: TokenProvider) {
  tokenProvider = provider;
}

export class ApiRequestError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(message: string, status: number, code: string, details?: unknown) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/** Default ceiling for any single request; real responses are far faster. */
export const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;

/**
 * For synchronous cap-hungry flows. The verification attempt POST can
 * legitimately take ~33s (CV 10s x 3 attempts + backoff), so it gets headroom.
 */
export const LONG_REQUEST_TIMEOUT_MS = 60_000;

export type ApiRequestOptions = RequestInit & { timeoutMs?: number };

/** fetch() with an absolute wall-clock ceiling that also honours a caller signal. */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  let timedOut = false;

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const abortFromCaller = () => controller.abort();
  init.signal?.addEventListener('abort', abortFromCaller, { once: true });
  if (init.signal?.aborted) {
    controller.abort();
  }

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (err) {
    if (timedOut) {
      throw new ApiRequestError(
        `Request timed out after ${Math.round(timeoutMs / 1000)}s.`,
        0,
        'REQUEST_TIMEOUT',
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
    init.signal?.removeEventListener('abort', abortFromCaller);
  }
}

/**
 * Which react-query cache keys a mutation invalidates. The offline cache only
 * holds a handful of lists (featured feed, artifact details), so we refresh
 * exactly what the mutation touches instead of clearing everything on every
 * POST/PATCH (which forced unrelated screens to refetch after any tiny action).
 */
function mutationInvalidationKeys(path: string): string[][] {
  if (path.startsWith('/verification-attempts')) {
    // A submission changes XP, collection, quests and story status, so the
    // home feed and any cached artifact detail are stale.
    return [['featured-artifacts'], ['artifact']];
  }
  const unlock = /^\/artifacts\/([^/]+)\/unlock-story$/.exec(path);
  if (unlock) {
    return [['artifact', decodeURIComponent(unlock[1])]];
  }
  return [];
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  const token = await tokenProvider();
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetchWithTimeout(`${getApiUrl()}/api/v1${path}`, { ...options, headers }, timeoutMs);
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = payload?.error;
    throw new ApiRequestError(
      error?.message ?? `Request failed with status ${response.status}.`,
      response.status,
      error?.code ?? 'REQUEST_FAILED',
      error?.details,
    );
  }
  if ((options.method ?? 'GET').toUpperCase() !== 'GET') {
    for (const key of mutationInvalidationKeys(path)) {
      void queryClient.invalidateQueries({ queryKey: ['offline', ...key] });
    }
  }
  return payload as T;
}

export function createIdempotencyKey() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.random() * 16 | 0;
    const value = character === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export async function apiRequestWithIdempotency<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Idempotency-Key', createIdempotencyKey());
  return apiRequest<T>(path, { ...options, headers });
}
