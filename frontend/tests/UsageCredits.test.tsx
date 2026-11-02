import { act, renderHook, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { USAGE_POLICY } from '../src/config/usagePolicy';
import { QuotaNotice } from '../src/features/analysis/QuotaNotice';
import { AuthContext, type AuthContextValue } from '../src/features/auth/AuthContext';
import type { ReportQuota } from '../src/hooks/useReportQuota';
import { useReportQuota } from '../src/hooks/useReportQuota';
import { useUsageCredits } from '../src/hooks/useUsageCredits';
import { renderWithProviders } from './testUtils';

const auth = (loggedIn: boolean): AuthContextValue => ({
  user: loggedIn ? { email: 'test@example.com', name: '테스트' } : null,
  isLoggedIn: loggedIn,
  isLoading: false,
  loginWithGoogle: () => {},
  logout: async () => {},
});

const wrapperFor =
  (loggedIn: boolean) =>
  ({ children }: { children: ReactNode }) => (
    <MemoryRouter>
      <AuthContext.Provider value={auth(loggedIn)}>{children}</AuthContext.Provider>
    </MemoryRouter>
  );

/** 테스트에서만 하루 제한을 정해 봐요. (지금 정책은 임시로 무제한) */
const policy = USAGE_POLICY as { guestDailyReports: number; memberDailyReports: number };
const original = { ...policy };
afterEach(() => Object.assign(policy, original));

const quota = (overrides: Partial<ReportQuota>): ReportQuota => ({
  limit: 3,
  remaining: 0,
  blocked: null,
  waitMinutes: 0,
  consume: () => {},
  canEarnMore: true,
  ...overrides,
});

describe('이용 제한 안내', () => {
  it('비로그인으로 다 쓰면 "Google로 로그인하면 더 이용할 수 있어요"', () => {
    renderWithProviders(<QuotaNotice quota={quota({ blocked: 'guest-daily' })} />);
    expect(screen.getByRole('note')).toHaveTextContent('Google로 로그인하면 더 이용할 수 있어요');
  });

  it('로그인 사용자가 다 쓰면 낱말퀴즈로 한 번 더 받으라고 안내하고 퀴즈로 가는 버튼이 있어요', () => {
    renderWithProviders(<QuotaNotice quota={quota({ blocked: 'member-daily' })} />);
    expect(screen.getByRole('note')).toHaveTextContent('낱말퀴즈를 풀고 한 번 더 받아 보세요');
    expect(screen.getByRole('link', { name: '낱말퀴즈 풀러 가기' })).toHaveAttribute(
      'href',
      '/terms?mode=crossword',
    );
  });

  it('보상도 다 받았으면 "내일 다시"로 안내해요', () => {
    renderWithProviders(
      <QuotaNotice quota={quota({ blocked: 'member-daily', canEarnMore: false })} />,
    );
    expect(screen.getByRole('note')).toHaveTextContent('내일 다시 이용할 수 있어요');
  });
});

describe('낱말퀴즈 완료 보상', () => {
  it('퍼즐을 다 풀면 리포트 만들기가 1회 늘어요', () => {
    policy.memberDailyReports = 3;
    const { result } = renderHook(
      () => ({ credits: useUsageCredits(), quota: useReportQuota('005930') }),
      { wrapper: wrapperFor(true) },
    );
    expect(result.current.quota.limit).toBe(3);
    act(() => {
      expect(result.current.credits.onPuzzleComplete('p1', { revealed: false })).toBe('granted');
    });
    expect(result.current.credits.bonus).toBe(1);
    expect(result.current.quota.limit).toBe(4);
  });

  it('정답 보기를 썼으면 보상이 없어요', () => {
    const { result } = renderHook(() => useUsageCredits(), { wrapper: wrapperFor(true) });
    act(() => {
      expect(result.current.onPuzzleComplete('p1', { revealed: true })).toBe('revealed');
    });
    expect(result.current.bonus).toBe(0);
  });

  it('하루 최대 2회, 같은 퍼즐은 한 번만, 비로그인은 보상이 없어요', () => {
    const { result } = renderHook(() => useUsageCredits(), { wrapper: wrapperFor(true) });
    act(() => {
      result.current.onPuzzleComplete('p1', { revealed: false });
    });
    act(() => {
      expect(result.current.onPuzzleComplete('p1', { revealed: false })).toBe('already');
      result.current.onPuzzleComplete('p2', { revealed: false });
    });
    act(() => {
      expect(result.current.onPuzzleComplete('p3', { revealed: false })).toBe('daily-max');
    });
    expect(result.current.bonus).toBe(2);
    expect(result.current.canEarnMore).toBe(false);

    const guest = renderHook(() => useUsageCredits(), { wrapper: wrapperFor(false) });
    expect(guest.result.current.onPuzzleComplete('p4', { revealed: false })).toBe('guest');
  });
});
