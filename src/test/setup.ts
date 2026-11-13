import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Node 25+ defines its own global `localStorage`, which is undefined unless
// Node is started with --localstorage-file, and it shadows jsdom's. Provide an
// in-memory Storage in that case so tests behave the same on every Node
// version (CI runs Node 20, where jsdom's storage is used as-is).
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  const memoryStorage: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key) => store.get(key) ?? null,
    key: (index) => [...store.keys()][index] ?? null,
    removeItem: (key) => {
      store.delete(key);
    },
    setItem: (key, value) => {
      store.set(key, String(value));
    },
  };
  Object.defineProperty(globalThis, 'localStorage', { value: memoryStorage, configurable: true });
}

afterEach(() => {
  // Unmount rendered trees and drop persisted settings so every test starts
  // from the defaults.
  cleanup();
  localStorage.clear();
});
