import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';
import { resetChatContext } from '../src/features/chat/chatContextStore';
import { resetPersistentStores } from '../src/hooks/persistentStore';
import { resetCommunityStore } from './fixtures/community';
import { failRequests, installFetchStub } from './fixtures/fetchStub';
import { resetMeStore } from './fixtures/me';
import { resetSessionUser } from './fixtures/session';
import { resetWalletStore } from './fixtures/wallet';
import { resetChatStore } from './fixtures/chat';
import { resetMockInvestStore } from './fixtures/mockInvest';

// 앱은 실제 API 를 불러요. 테스트에서는 fetch 를 가로채 fixtures 데이터로 응답해요.
beforeEach(() => {
  installFetchStub();
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  resetPersistentStores();
  resetChatContext();
  resetCommunityStore();
  resetMeStore();
  resetWalletStore();
  resetChatStore();
  resetMockInvestStore();
  resetSessionUser();
  failRequests(null);
});

// jsdom 에는 없는 브라우저 API (Recharts ResponsiveContainer 가 사용)
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}
