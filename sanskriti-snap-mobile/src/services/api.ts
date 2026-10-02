export type TokenProvider = () => Promise<string | null>;

const apiUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
let tokenProvider: TokenProvider = async () => null;

export function configureApiTokenProvider(provider: TokenProvider) {
  tokenProvider = provider;
}

export class ApiRequestError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(
    message: string,
    status: number,
    code: string,
    details?: unknown,
  ) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (!apiUrl) {
    throw new Error(
      'EXPO_PUBLIC_API_URL is not configured. Set it to the backend origin.',
    );
  }

  const token = await tokenProvider();
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${apiUrl}/api/v1${path}`, {
    ...options,
    headers,
  });
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

  return payload as T;
}

export function createIdempotencyKey() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.random() * 16 | 0;
    const value = character === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}
