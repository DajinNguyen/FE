import { useCallback } from 'react';
import { USAGE_POLICY } from '../config/usagePolicy';
import { useAuth } from './useAuth';
import { useUsageCredits } from './useUsageCredits';
import { createPersistentStore, usePersistentStore } from './persistentStore';

/**
 * 리포트 만들기 횟수. 지금은 기기(localStorage)에 기록해서 흉내 내요.
 * 서버가 남은 횟수를 알려주게 되면 이 훅 안만 서버 값으로 바꾸면 돼요.
 */
interface UsageRecord {
  /** 횟수를 센 날짜 (YYYY-MM-DD, 기기 시간 기준). 날짜가 바뀌면 0부터 다시 세요. */
  date: string;
  count: number;
}

const usageStore = createPersistentStore<UsageRecord>('dajin:report-usage', {
  date: '',
  count: 0,
});

const todayString = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

/**
 * 막힌 이유 (같은 기업을 다시 만드는 간격 제한은 없어요)
 * guest-daily  : 비로그인 하루 횟수를 다 썼어요 → 로그인 안내
 * member-daily : 로그인 사용자 하루 횟수를 다 썼어요 → 내일 다시
 */
export type QuotaBlock = 'guest-daily' | 'member-daily';

export function useReportQuota() {
  const record = usePersistentStore(usageStore);
  const { isLoggedIn } = useAuth();
  const { bonus, canEarnMore } = useUsageCredits();

  // 로그인 사용자는 낱말퀴즈 보상만큼 더 만들 수 있어요.
  const limit =
    (isLoggedIn ? USAGE_POLICY.memberDailyReports : USAGE_POLICY.guestDailyReports) + bonus;
  const used = record.date === todayString() ? record.count : 0;
  const remaining = Math.max(0, limit - used);

  let blocked: QuotaBlock | null = null;
  if (remaining === 0) blocked = isLoggedIn ? 'member-daily' : 'guest-daily';

  /** 만들기를 눌렀을 때 한 번 세요. */
  const consume = useCallback(() => {
    const today = todayString();
    usageStore.set((prev) => ({
      date: today,
      count: (prev.date === today ? prev.count : 0) + 1,
    }));
  }, []);

  return {
    limit,
    remaining,
    blocked,
    consume,
    /** 오늘 낱말퀴즈로 횟수를 더 받을 수 있는지 */
    canEarnMore,
    /** 오늘 낱말퀴즈로 받은 추가 횟수 */
    bonus,
  };
}

export type ReportQuota = ReturnType<typeof useReportQuota>;
