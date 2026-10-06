import { apiRequest, ApiRequestError, configureApiTokenProvider } from '../api';

describe('apiRequest timeouts and abort', () => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.EXPO_PUBLIC_API_URL;

  beforeAll(() => {
    process.env.EXPO_PUBLIC_API_URL = 'https://api.example.test';
  });

  afterAll(() => {
    if (originalUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = originalUrl;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    configureApiTokenProvider(async () => null);
  });

  function response(payload: unknown, status = 200): Response {
    return new Response(JSON.stringify(payload), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  it('returns the payload for a successful request', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(response({ ok: true }));
    await expect(apiRequest('/artifacts/featured')).resolves.toEqual({ ok: true });
  });

  it('includes the bearer token from the configured provider', async () => {
    configureApiTokenProvider(async () => 'token-123');
    globalThis.fetch = jest.fn().mockResolvedValue(response({ ok: true }));
    await apiRequest('/me');
    const [url, init] = (globalThis.fetch as jest.Mock).mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/api/v1/me');
    expect((init.headers as Headers).get('Authorization')).toBe('Bearer token-123');
  });

  it('times out with REQUEST_TIMEOUT when the server never responds', async () => {
    globalThis.fetch = jest.fn().mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          );
        }),
    );

    await expect(apiRequest('/slow', { timeoutMs: 20 })).rejects.toMatchObject({
      name: 'ApiRequestError',
      code: 'REQUEST_TIMEOUT',
    });
  }, 10_000);

  it('rethrows a caller-initiated abort instead of wrapping it', async () => {
    globalThis.fetch = jest.fn().mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          );
        }),
    );

    const caller = new AbortController();
    const pending = apiRequest('/me', {
      timeoutMs: 10_000,
      signal: caller.signal,
    });
    // Let apiRequest reach fetchWithTimeout and attach its listener first.
    await new Promise((resolve) => setTimeout(resolve, 0));
    caller.abort();

    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  }, 10_000);

  it('maps an error response to ApiRequestError', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(
      response({ error: { message: 'Not found', code: 'NOT_FOUND' } }, 404),
    );
    await expect(apiRequest('/artifacts/nope', { timeoutMs: 5_000 })).rejects.toMatchObject({
      name: ApiRequestError.name,
      code: 'NOT_FOUND',
      status: 404,
    });
  });
});