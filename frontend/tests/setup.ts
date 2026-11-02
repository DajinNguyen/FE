import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { setSessionUser } from '../src/api/session';
import { resetPersistentStores } from '../src/hooks/persistentStore';
import { resetCommunityStore } from '../src/mocks/community';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  resetPersistentStores();
  resetCommunityStore();
  setSessionUser(null);
});

// jsdom 에는 없는 브라우저 API (Recharts ResponsiveContainer 가 사용)
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}
