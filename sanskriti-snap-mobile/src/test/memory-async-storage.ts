/**
 * In-memory AsyncStorage double, shareable across service tests.
 *
 * The real native module is not available under jest-expo's node preset.
 * This keeps a `Map` and mimics AsyncStorage's string-only contract.
 */
export function mockCreateMemoryAsyncStorage() {
  const store = new Map<string, string>();

  return {
    __store: store,
    getItem: jest.fn(async (key: string) => store.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string): Promise<void> => {
      store.set(key, value);
    }),
    removeItem: jest.fn(async (key: string): Promise<void> => {
      store.delete(key);
    }),
    getAllKeys: jest.fn(async () => Array.from(store.keys())),
    multiRemove: jest.fn(async (keys: string[]): Promise<void> => {
      for (const key of keys) store.delete(key);
    }),
    clear: jest.fn(async () => store.clear()),
  };
}

export type MemoryAsyncStorage = ReturnType<typeof mockCreateMemoryAsyncStorage>;
