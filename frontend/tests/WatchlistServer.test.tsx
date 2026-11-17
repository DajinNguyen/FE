import { act, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from '../src/App';
import { DEV_USER } from '../src/features/auth/AuthContext';
import { SYNC_TIMING } from '../src/hooks/syncedRecord';
import { migrateWatchlistKeys, useWatchlist, WATCHLIST_LIMIT } from '../src/hooks/useWatchlist';
import { failRequests } from './fixtures/fetchStub';
import { serverWatchlist } from './fixtures/me';
import { providersWrapper, renderWithProviders } from './testUtils';

const original = { ...SYNC_TIMING };
beforeEach(() => Object.assign(SYNC_TIMING, { debounce: 0, retryDelays: [30] }));
afterEach(() => Object.assign(SYNC_TIMING, original));

describe('관심 기업 서버 저장 (GET·PUT /api/me/watchlist)', () => {
  it('로그인하면 서버에 저장된 목록을 보여줘요 (다른 기기에서 담은 회사)', async () => {
    serverWatchlist.set(DEV_USER.id!, ['005930']);
    renderWithProviders(<App />, { route: '/watchlist', user: DEV_USER });
    expect(await screen.findByText('삼성전자')).toBeInTheDocument();
  });

  it('하트를 누르면 { stock_codes } 전체 목록을 담은 순서대로 서버에 저장해요', async () => {
    serverWatchlist.set(DEV_USER.id!, ['000660']);
    const { result } = renderHook(() => useWatchlist(), { wrapper: providersWrapper(DEV_USER) });
    await waitFor(() => expect(result.current.stockCodes).toEqual(['000660']));

    let outcome: string | undefined;
    act(() => {
      outcome = result.current.toggle('005930');
    });
    expect(outcome).toBe('added');
    await waitFor(() => expect(serverWatchlist.get(DEV_USER.id!)).toEqual(['000660', '005930']));

    act(() => {
      outcome = result.current.toggle('000660');
    });
    expect(outcome).toBe('removed');
    await waitFor(() => expect(serverWatchlist.get(DEV_USER.id!)).toEqual(['005930']));
  });

  it('저장에 실패해도 화면은 바로 바뀌고, 다시 시도해서 뺀 회사가 되살아나지 않아요', async () => {
    serverWatchlist.set(DEV_USER.id!, ['000660', '005930']);
    const { result } = renderHook(() => useWatchlist(), { wrapper: providersWrapper(DEV_USER) });
    await waitFor(() => expect(result.current.stockCodes).toEqual(['000660', '005930']));

    failRequests((path) => path.startsWith('/api/me/watchlist'));
    act(() => {
      result.current.toggle('000660');
    });
    expect(result.current.stockCodes).toEqual(['005930']);

    failRequests(null);
    await waitFor(() => expect(serverWatchlist.get(DEV_USER.id!)).toEqual(['005930']));
    expect(result.current.stockCodes).toEqual(['005930']);
  });

  it('서버 API 전에 이 기기 계정 키에 담아 둔 회사도 처음 로그인할 때 서버로 올려요', async () => {
    window.localStorage.setItem('dajin:dev-user:watchlist', JSON.stringify(['035420']));
    migrateWatchlistKeys();
    serverWatchlist.set(DEV_USER.id!, ['005930']);
    const { result } = renderHook(() => useWatchlist(), { wrapper: providersWrapper(DEV_USER) });

    await waitFor(() => expect(serverWatchlist.get(DEV_USER.id!)).toEqual(['005930', '035420']));
    expect(result.current.stockCodes).toEqual(['005930', '035420']);
    expect(window.localStorage.getItem('dajin:dev-user:watchlist')).toBeNull();
  });

  it(`${WATCHLIST_LIMIT}개가 차면 더 담지 않고 안내해요`, async () => {
    const full = Array.from({ length: WATCHLIST_LIMIT }, (_, i) => String(100000 + i));
    serverWatchlist.set(DEV_USER.id!, full);
    const { result } = renderHook(() => useWatchlist(), { wrapper: providersWrapper(DEV_USER) });
    await waitFor(() => expect(result.current.stockCodes).toHaveLength(WATCHLIST_LIMIT));

    let outcome: string | undefined;
    act(() => {
      outcome = result.current.toggle('005930');
    });
    expect(outcome).toBe('full');
    expect(result.current.isWatched('005930')).toBe(false);
  });

  it('회사 화면 하트: 담기·빼기 결과를 알려줘요', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/companies/005930', user: DEV_USER });
    await user.click(await screen.findByRole('button', { name: '관심 기업에 담기' }));
    expect(await screen.findByText(/관심 기업에 담았어요/)).toBeInTheDocument();
    await waitFor(() => expect(serverWatchlist.get(DEV_USER.id!)).toEqual(['005930']));
  });
});
