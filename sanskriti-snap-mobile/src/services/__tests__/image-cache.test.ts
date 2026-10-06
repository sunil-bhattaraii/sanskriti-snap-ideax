const mockStore = new Map<string, { bytes: number; modified: number }>();
const mockClock = { value: 0 };

const mockFileSystem = {
  documentDirectory: 'file:///docs/',
  makeDirectoryAsync: jest.fn(async () => undefined),
  downloadAsync: jest.fn(async (_remoteUrl: string, localUri: string) => {
    mockClock.value += 1;
    mockStore.set(localUri, { bytes: 1024 * 1024, modified: mockClock.value });
    return { status: 200 };
  }),
  getInfoAsync: jest.fn(async (localUri: string) => {
    const entry = mockStore.get(localUri);
    return entry
      ? {
          exists: true,
          isDirectory: false,
          uri: localUri,
          size: entry.bytes,
          modificationTime: entry.modified,
        }
      : { exists: false, isDirectory: false, uri: localUri };
  }),
  readDirectoryAsync: jest.fn(async () =>
    Array.from(mockStore.keys()).map((uri) => uri.split('/').pop() ?? ''),
  ),
  deleteAsync: jest.fn(async (localUri: string) => {
    mockStore.delete(localUri);
  }),
};

jest.mock('expo-file-system/legacy', () => mockFileSystem);

const { getCachedImageUri } = jest.requireActual('../image-cache');

const DIR = 'file:///docs/offline-images/';

function seedFile(index: number) {
  mockStore.set(`${DIR}seed-${index}.img`, {
    bytes: 1024 * 1024,
    modified: 1000 + index + 1,
  });
}

describe('image-cache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStore.clear();
    mockClock.value = 2000;
  });

  it('downloads a remote image once and reuses the cached URI', async () => {
    const first = await getCachedImageUri('https://img.example/a.jpg');
    expect(first).toMatch(/^file:\/\/\/docs\/offline-images\/[^/]+\.img$/);
    expect(mockFileSystem.downloadAsync).toHaveBeenCalledTimes(1);
    expect(mockFileSystem.downloadAsync).toHaveBeenCalledWith('https://img.example/a.jpg', first);

    const second = await getCachedImageUri('https://img.example/a.jpg');
    expect(second).toBe(first);
    expect(mockFileSystem.downloadAsync).toHaveBeenCalledTimes(1);
  });

  it('evicts the oldest files once the cache grows past the caps', async () => {
    for (let index = 0; index < 205; index += 1) seedFile(index);

    const uri = await getCachedImageUri('https://img.example/new.jpg');
    expect(uri).toMatch(/^file:\/\/\/docs\/offline-images\/[^/]+\.img$/);
    expect(mockStore.size).toBeLessThanOrEqual(200);
    expect(mockFileSystem.deleteAsync).toHaveBeenCalled();
    for (let index = 0; index < 6; index += 1) {
      expect(mockStore.has(`${DIR}seed-${index}.img`)).toBe(false);
    }
    expect(mockStore.has(`${DIR}seed-6.img`)).toBe(true);
    expect(mockStore.has(uri as string)).toBe(true);
  });

  it('does not prune when a download fails', async () => {
    mockFileSystem.downloadAsync.mockResolvedValueOnce({ status: 500 });
    const uri = await getCachedImageUri('https://img.example/bad.jpg');
    expect(uri).toBeNull();
    expect(mockFileSystem.deleteAsync).not.toHaveBeenCalled();
  });

  it('returns null when no URL is provided', async () => {
    expect(await getCachedImageUri(null)).toBeNull();
  });
});