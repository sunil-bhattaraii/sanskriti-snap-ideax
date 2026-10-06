import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => {
  const { mockCreateMemoryAsyncStorage: make } = jest.requireActual(
    '../../test/memory-async-storage',
  );
  return {
    __esModule: true,
    default: make(),
  };
});

const mockApi = {
  apiRequest: jest.fn(),
  createIdempotencyKey: jest.fn(() => 'idem-1'),
  fetchWithTimeout: jest.fn((input: unknown, init: RequestInit) =>
    fetch(input as RequestInfo, init),
  ),
  LONG_REQUEST_TIMEOUT_MS: 60_000,
};
jest.mock('../api', () => mockApi);

const mockLocalPhotos = { updateLocalPhotoStatus: jest.fn() };
jest.mock('../local-photos', () => mockLocalPhotos);

const { enqueueVerification, processPendingVerifications } = jest.requireActual('../upload-queue');

const QUEUE_KEY = '@sanskriti_verification_upload_queue_v1';

beforeEach(async () => {
  jest.clearAllMocks();
  mockApi.createIdempotencyKey.mockReturnValue('idem-1');
  await AsyncStorage.clear();
  global.fetch = jest.fn(async (url: unknown) => {
    const href = String(url);
    if (href.startsWith('file://')) {
      return { blob: async () => ({ size: 1 }) } as Response;
    }
    return {
      ok: true,
      json: async () => ({ public_id: 'public_id_from_mock_media_sign' }),
    } as Response;
  });
});

const input = {
  localPhotoId: 'lp-1',
  artifactId: '65b7c9d4e4b0a1b2c3d4e5f6',
  imageUri: 'file:///photo.jpg',
  galleryUris: ['file:///g1.jpg', 'file:///g2.jpg'],
  gpsLat: 27.67,
  gpsLng: 85.32,
  gpsAccuracy: 12,
  gpsCapturedAt: '2026-01-01T00:00:00.000Z',
  privateNote: null,
};

describe('enqueueVerification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.createIdempotencyKey.mockReturnValue('idem-1');
  });

  it('starts items in pending state with an idempotency key', async () => {
    const item = await enqueueVerification(input);
    expect(item.status).toBe('pending');
    expect(item.retryCount).toBe(0);
    expect(item.idempotencyKey).toBe('idem-1');
    expect(mockApi.createIdempotencyKey).toHaveBeenCalledTimes(1);
    expect(item.imageUri).toBe('file:///photo.jpg');
  });

  it('persists to the queue and is durable across reads', async () => {
    await enqueueVerification(input);
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const queued = JSON.parse(raw as string);
    expect(queued).toHaveLength(1);
    expect(queued[0].id).toEqual(expect.any(String));
    expect(queued[0].createdAt).toEqual(expect.any(String));
  });

  it('appends rather than overwriting earlier queue items', async () => {
    await enqueueVerification(input);
    await enqueueVerification({ ...input, localPhotoId: 'lp-2', imageUri: 'file:///two.jpg' });
    const raw = JSON.parse((await AsyncStorage.getItem(QUEUE_KEY)) as string);
    expect(raw).toHaveLength(2);
    expect(raw.map((i: { imageUri: string }) => i.imageUri)).toEqual([
      'file:///photo.jpg',
      'file:///two.jpg',
    ]);
  });
});

describe('processPendingVerifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.createIdempotencyKey.mockReturnValue('idem-1');
  });

  it('removes a successfully verified item from the queue', async () => {
    mockApi.apiRequest.mockResolvedValue({ attemptId: 'a1' });
    const item = await enqueueVerification(input);

    await processPendingVerifications();

    expect(mockApi.apiRequest).toHaveBeenCalledTimes(4); // 1 snap + 2 gallery + 1 attempt
    expect(mockLocalPhotos.updateLocalPhotoStatus).toHaveBeenCalledWith('lp-1', 'uploaded');
    const remaining = JSON.parse((await AsyncStorage.getItem(QUEUE_KEY)) as string);
    expect(remaining).toHaveLength(0);
expect(mockApi.apiRequest.mock.calls[3][0]).toBe('/verification-attempts');
    const callBody = JSON.parse(mockApi.apiRequest.mock.calls[3][1].body);
    expect(callBody.artifactId).toBe(input.artifactId);
    expect(callBody.verificationImagePublicId).toBe('public_id_from_mock_media_sign');
    expect(callBody.location.accuracyMeters).toBe(12);
    expect(item.status).toBe('pending'); // enqueue copy is not mutated
  });

  it('marks the item failed and bumps retryCount when the attempt errors', async () => {
    mockApi.apiRequest.mockRejectedValueOnce(new Error('CV down'));
    await enqueueVerification(input);

    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await processPendingVerifications();
    warn.mockRestore();

    expect(mockLocalPhotos.updateLocalPhotoStatus).toHaveBeenCalledWith('lp-1', 'failed');
    const remaining = JSON.parse((await AsyncStorage.getItem(QUEUE_KEY)) as string);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].status).toBe('failed');
    expect(remaining[0].retryCount).toBe(1);
  });

  it('uploads every gallery photo up to six', async () => {
    mockApi.apiRequest.mockResolvedValue({ attemptId: 'a1' });
    await enqueueVerification({
      ...input,
      galleryUris: Array.from({ length: 8 }, (_, i) => `file:///g${i}.jpg`),
    });

    await processPendingVerifications();

    // 1 snap + 6 gallery uploads + 1 verification-attempt call.
    expect(mockApi.apiRequest).toHaveBeenCalledTimes(8);
  });

  it('re-records an item stranded in uploading state as pending first', async () => {
    mockApi.apiRequest.mockResolvedValue({ attemptId: 'a1' });
    await enqueueVerification(input);

    // Simulate the previous run dying mid-upload.
    const raw = JSON.parse((await AsyncStorage.getItem(QUEUE_KEY)) as string);
    raw[0].status = 'uploading';
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(raw));

    await processPendingVerifications();

    const remaining = JSON.parse((await AsyncStorage.getItem(QUEUE_KEY)) as string);
    expect(remaining).toHaveLength(0);
  });

  it('does not mark a pending-but-unflushed item twice (processing guard)', async () => {
    mockApi.apiRequest.mockResolvedValue({ attemptId: 'a1' });
    await enqueueVerification(input);

    await Promise.all([processPendingVerifications(), processPendingVerifications()]);

    // Second call no-ops because `processing` is set for the first.
    expect(mockApi.apiRequest.mock.calls.filter(([path]) => path === '/verification-attempts')).toHaveLength(1);
  });
});
