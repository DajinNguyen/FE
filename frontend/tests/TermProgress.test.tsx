import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEV_USER } from '../src/features/auth/AuthContext';
import { SAVE_FAILED_TOAST, SYNC_TIMING } from '../src/hooks/syncedRecord';
import { countStreak } from '../src/hooks/useTermProgress';
import { TermCardsPage } from '../src/pages/TermCardsPage';
import type { TermProgress } from '../src/types';
import { failRequests } from './fixtures/fetchStub';
import { serverTermProgress } from './fixtures/me';
import { renderWithProviders } from './testUtils';

const GUEST_KEY = 'dajin:term-progress-v2';
const original = { ...SYNC_TIMING };
beforeEach(() => Object.assign(SYNC_TIMING, { debounce: 0, retryDelays: [30] }));
afterEach(() => Object.assign(SYNC_TIMING, original));

const putCalls = () =>
  vi
    .mocked(fetch)
    .mock.calls.filter(
      ([url, init]) => String(url).includes('/api/me/term-progress') && init?.method === 'PUT',
    );

const item = (status: 'learning' | 'mastered', at: string, correct = 0) => ({
  status,
  correct_count: correct,
  wrong_count: 0,
  last_studied_at: at,
  set_id: 'basic',
});

/** 카드 학습에서 첫 카드(주식)에 [알았어요] */
async function knowFirstCard() {
  await userEvent.click(await screen.findByRole('button', { name: '알았어요' }));
}

describe('로그인 사용자별 학습 기록 저장', () => {
  it('비로그인은 이 기기(localStorage)에만 저장하고 "로그인하면 기록이 저장돼요"를 보여줘요', async () => {
    renderWithProviders(<TermCardsPage />, { route: '/terms?mode=cards' });
    expect(screen.getByText(/로그인하면 기록이 저장돼요/)).toBeInTheDocument();

    await knowFirstCard();
    const saved = JSON.parse(window.localStorage.getItem(GUEST_KEY)!) as TermProgress;
    expect(saved.terms.stock.status).toBe('mastered');
    expect(putCalls()).toHaveLength(0);

    const record = screen.getByRole('region', { name: '내 학습 기록' });
    expect(record).toHaveTextContent('외운 용어1개');
    expect(record).toHaveTextContent('오늘 학습1개');
    expect(record).toHaveTextContent('연속 학습1일');
  });

  it('로그인하면 서버에 저장해요 (다른 기기에서 이어서 학습)', async () => {
    renderWithProviders(<TermCardsPage />, { route: '/terms?mode=cards', user: DEV_USER });
    expect(screen.queryByText(/로그인하면 기록이 저장돼요/)).not.toBeInTheDocument();

    await knowFirstCard();
    await waitFor(() =>
      expect(serverTermProgress.get(DEV_USER.id!)?.terms.stock.status).toBe('mastered'),
    );
    expect(putCalls().length).toBeGreaterThan(0);
    expect(window.localStorage.getItem(GUEST_KEY)).toBeNull();
  });

  it('처음 로그인하면 기기 기록과 서버 기록을 용어별로 더 진행된 쪽으로 합치고 기기 기록은 지워요', async () => {
    window.localStorage.setItem(
      GUEST_KEY,
      JSON.stringify({
        terms: {
          stock: item('mastered', '2026-11-10T01:00:00Z'),
          shareholder: item('learning', '2026-11-10T01:00:00Z'),
        },
        set_progress: [],
        study_dates: ['2026-11-10'],
      }),
    );
    serverTermProgress.set(DEV_USER.id!, {
      terms: {
        shareholder: item('mastered', '2026-11-01T01:00:00Z', 3),
        listing: item('learning', '2026-11-01T01:00:00Z'),
      },
      set_progress: [],
      study_dates: ['2026-11-01'],
    });

    renderWithProviders(<TermCardsPage />, { route: '/terms?mode=cards', user: DEV_USER });

    await waitFor(() => expect(serverTermProgress.get(DEV_USER.id!)?.terms.stock).toBeDefined());
    const merged = serverTermProgress.get(DEV_USER.id!)!;
    expect(merged.terms.stock.status).toBe('mastered');
    expect(merged.terms.shareholder.status).toBe('mastered');
    expect(merged.terms.shareholder.correct_count).toBe(3);
    expect(merged.terms.listing.status).toBe('learning');
    expect(merged.study_dates).toEqual(['2026-11-01', '2026-11-10']);
    expect(merged.set_progress).toEqual([{ set_id: 'basic', mastered: 2, studied: 3 }]);
    expect(JSON.parse(window.localStorage.getItem(GUEST_KEY)!).terms).toEqual({});
  });

  it('저장에 실패하면 기기에 임시로 두고 토스트를 띄운 뒤 다시 시도해요', async () => {
    renderWithProviders(<TermCardsPage />, { route: '/terms?mode=cards', user: DEV_USER });
    await screen.findByRole('button', { name: '알았어요' });
    await waitFor(() => expect(serverTermProgress.get(DEV_USER.id!)).toBeUndefined());

    failRequests((path) => path === '/api/me/term-progress');
    await knowFirstCard();

    expect(await screen.findByText(SAVE_FAILED_TOAST)).toBeInTheDocument();
    const pending = JSON.parse(window.localStorage.getItem(`${GUEST_KEY}:pending`)!);
    expect(pending.data.terms.stock.status).toBe('mastered');

    failRequests(null);
    await waitFor(() =>
      expect(serverTermProgress.get(DEV_USER.id!)?.terms.stock.status).toBe('mastered'),
    );
    expect(window.localStorage.getItem(`${GUEST_KEY}:pending`)).toBe('null');
  });

  it('연속 학습일은 오늘(오늘 안 했으면 어제)부터 이어진 날을 세요', () => {
    expect(countStreak(['2026-11-11', '2026-11-12', '2026-11-13'], '2026-11-13')).toBe(3);
    expect(countStreak(['2026-11-11', '2026-11-12'], '2026-11-13')).toBe(2);
    expect(countStreak(['2026-11-10', '2026-11-12'], '2026-11-13')).toBe(1);
    expect(countStreak(['2026-11-10'], '2026-11-13')).toBe(0);
  });
});
