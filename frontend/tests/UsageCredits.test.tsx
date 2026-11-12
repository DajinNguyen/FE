import { act, renderHook, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { USAGE_POLICY } from '../src/config/usagePolicy';
import { QuotaNotice } from '../src/features/analysis/QuotaNotice';
import { DEV_USER } from '../src/features/auth/AuthContext';
import { emptyCredits, forToday } from '../src/features/crossword/puzzleReward';
import { SYNC_TIMING } from '../src/hooks/syncedRecord';
import type { ReportQuota } from '../src/hooks/useReportQuota';
import { useReportQuota } from '../src/hooks/useReportQuota';
import { useUsageCredits } from '../src/hooks/useUsageCredits';
import { serverCredits } from './fixtures/me';
import { providersWrapper, renderWithProviders } from './testUtils';

const timing = { ...SYNC_TIMING };
beforeEach(() => Object.assign(SYNC_TIMING, { debounce: 0, retryDelays: [30] }));
afterEach(() => Object.assign(SYNC_TIMING, timing));

/** 테스트에서만 하루 제한을 정해 봐요. (지금 정책은 임시로 무제한) */
const policy = USAGE_POLICY as { guestDailyReports: number; memberDailyReports: number };
const original = { ...policy };
afterEach(() => Object.assign(policy, original));

const quota = (overrides: Partial<ReportQuota>): ReportQuota => ({
  limit: 3,
  remaining: 0,
  blocked: null,
  consume: () => {},
  canEarnMore: true,
  bonus: 0,
  ...overrides,
});

describe('이용 제한 안내', () => {
  it('비로그인으로 다 쓰면 "Google로 로그인하면 더 이용할 수 있어요"', () => {
    renderWithProviders(<QuotaNotice quota={quota({ blocked: 'guest-daily' })} />);
    expect(screen.getByRole('note')).toHaveTextContent('Google로 로그인하면 더 이용할 수 있어요');
  });

  it('로그인 사용자가 다 쓰면 낱말퀴즈로 한 번 더 받으라고 안내하고 퀴즈로 가는 버튼이 있어요', () => {
    renderWithProviders(<QuotaNotice quota={quota({ blocked: 'member-daily' })} />);
    expect(screen.getByRole('note')).toHaveTextContent(
      '낱말퀴즈 3개를 풀면 AI 리포트를 한 번 더 만들 수 있어요',
    );
    expect(screen.getByRole('link', { name: '낱말퀴즈 풀러 가기' })).toHaveAttribute(
      'href',
      '/terms',
    );
  });

  it('남은 횟수에 낱말퀴즈 보상이 반영돼요', () => {
    renderWithProviders(<QuotaNotice quota={quota({ remaining: 2, bonus: 1 })} />);
    expect(
      screen.getByText('오늘 2번 더 만들 수 있어요 (낱말퀴즈 보상 1회 포함)'),
    ).toBeInTheDocument();
  });

  it('보상도 다 받았으면 "내일 다시"로 안내해요', () => {
    renderWithProviders(
      <QuotaNotice quota={quota({ blocked: 'member-daily', canEarnMore: false })} />,
    );
    expect(screen.getByRole('note')).toHaveTextContent('내일 다시 이용할 수 있어요');
  });
});

describe('낱말퀴즈 3개 완료 = AI 리포트 1회 추가', () => {
  type Hook = { current: ReturnType<typeof useUsageCredits> };
  const solve = (hook: Hook, id: string, revealed = false) => {
    let result = '';
    act(() => {
      result = hook.current.onPuzzleComplete(id, { revealed });
    });
    return result;
  };
  const posted = () =>
    vi
      .mocked(fetch)
      .mock.calls.filter(([url]) => String(url).includes('/api/me/puzzle-completions'));

  const renderMember = async () => {
    const hook = renderHook(() => ({ credits: useUsageCredits(), quota: useReportQuota() }), {
      wrapper: providersWrapper(DEV_USER),
    });
    // 서버 기록을 받은 뒤부터 세요.
    await waitFor(() =>
      expect(
        vi.mocked(fetch).mock.calls.some(([url]) => String(url).includes('usage-credits')),
      ).toBe(true),
    );
    const credits = {
      get current() {
        return hook.result.current.credits;
      },
    };
    return { hook, credits };
  };

  it('퀴즈 2개까지는 보상이 없고(1/3, 2/3), 3개를 풀면 리포트 만들기가 1회 늘어요', async () => {
    policy.memberDailyReports = 3;
    const { hook, credits } = await renderMember();
    expect(hook.result.current.quota.limit).toBe(3);

    expect(solve(credits, 'p1')).toBe('progress');
    expect(credits.current.progress).toBe(1);
    expect(solve(credits, 'p2')).toBe('progress');
    expect(credits.current.progress).toBe(2);
    expect(credits.current.bonus).toBe(0);
    expect(hook.result.current.quota.limit).toBe(3);

    expect(solve(credits, 'p3')).toBe('granted');
    expect(credits.current.bonus).toBe(1);
    expect(credits.current.rewardsToday).toBe(1);
    expect(hook.result.current.quota.limit).toBe(4);

    // 완료 기록(퀴즈 id, 완료 시각, 정답 보기 여부)을 서버에 보내고, 서버가 판단한 값으로 맞춰요.
    await waitFor(() => expect(serverCredits.get(DEV_USER.id!)?.rewards_today).toBe(1));
    expect(posted()).toHaveLength(3);
    const body = JSON.parse(String(posted()[0][1]?.body));
    expect(body).toEqual({ puzzle_id: 'p1', completed_at: expect.any(String), revealed: false });
  });

  it('정답 보기를 쓴 퀴즈는 개수에 넣지 않아요', async () => {
    const { credits } = await renderMember();
    expect(solve(credits, 'p1', true)).toBe('revealed');
    expect(credits.current.progress).toBe(0);
    expect(credits.current.bonus).toBe(0);
  });

  it('보상은 하루 최대 2회(퀴즈 6개)이고, 같은 퀴즈는 하루 한 번만 세요', async () => {
    const { credits } = await renderMember();
    solve(credits, 'p1');
    expect(solve(credits, 'p1')).toBe('already');
    for (const id of ['p2', 'p3', 'p4', 'p5', 'p6']) solve(credits, id);
    expect(credits.current.bonus).toBe(2);
    expect(credits.current.canEarnMore).toBe(false);
    expect(solve(credits, 'p7')).toBe('daily-max');
    expect(credits.current.bonus).toBe(2);
  });

  it('비로그인은 개수만 세고(최대 3/3) 보상은 없어요', () => {
    policy.guestDailyReports = 1;
    const { result } = renderHook(() => ({ credits: useUsageCredits(), quota: useReportQuota() }), {
      wrapper: providersWrapper(null),
    });
    const credits = {
      get current() {
        return result.current.credits;
      },
    };
    for (const id of ['p1', 'p2', 'p3', 'p4']) expect(solve(credits, id)).toBe('guest');
    expect(credits.current.progress).toBe(3);
    expect(credits.current.bonus).toBe(0);
    expect(result.current.quota.limit).toBe(1);
    expect(posted()).toHaveLength(0);
  });

  it('날짜가 바뀌면 오늘 보상 횟수는 0부터, 센 퀴즈 수(2/3)는 남겨요', () => {
    const yesterday = {
      ...emptyCredits,
      date: '2026-11-12',
      rewards_today: 2,
      progress: 2,
      counted_today: ['p1'],
    };
    expect(forToday(yesterday, '2026-11-13')).toMatchObject({
      date: '2026-11-13',
      rewards_today: 0,
      progress: 2,
      counted_today: [],
    });
  });
});
