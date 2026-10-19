import { useCallback, useEffect, useState } from 'react';
import { USAGE_POLICY } from '../config/usagePolicy';
import { useAuth } from './useAuth';
import { createPersistentStore, usePersistentStore } from './persistentStore';

/**
 * 리포트 만들기 횟수. 지금은 기기(localStorage)에 기록해서 흉내 내요.
 * 서버가 남은 횟수를 알려주게 되면 이 훅 안만 서버 값으로 바꾸면 돼요.
 */
interface UsageRecord {
  /** 횟수를 센 날짜 (YYYY-MM-DD, 기기 시간 기준). 날짜가 바뀌면 0부터 다시 세요. */
  date: string;
  count: number;
  /** 기업별 마지막으로 만들기를 누른 시각 (ms) */
  lastByCompany: Record<string, number>;
}

const usageStore = createPersistentStore<UsageRecord>('dajin:report-usage', {
  date: '',
  count: 0,
  lastByCompany: {},
});

const todayString = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

const MINUTE = 60_000;

/**
 * 막힌 이유
 * guest-daily  : 비로그인 하루 횟수를 다 썼어요 → 로그인 안내
 * member-daily : 로그인 사용자 하루 횟수를 다 썼어요 → 내일 다시
 * interval     : 같은 기업을 방금 만들었어요 → N분 뒤에 다시
 */
export type QuotaBlock = 'guest-daily' | 'member-daily' | 'interval';

export function useReportQuota(stockCode: string) {
  const record = usePersistentStore(usageStore);
  const { isLoggedIn } = useAuth();

  const limit = isLoggedIn ? USAGE_POLICY.memberDailyReports : USAGE_POLICY.guestDailyReports;
  const used = record.date === todayString() ? record.count : 0;
  const remaining = Math.max(0, limit - used);

  // 다시 만들기 간격은 시간이 지나면 풀리니까 1분마다 다시 계산해요.
  const [now, setNow] = useState(() => Date.now());
  const last = record.lastByCompany[stockCode];
  const intervalMs = USAGE_POLICY.regenerateIntervalMinutes * MINUTE;
  const waitMs = last ? last + intervalMs - now : 0;
  useEffect(() => {
    if (waitMs <= 0) return;
    const timer = setInterval(() => setNow(Date.now()), Math.min(MINUTE, waitMs));
    return () => clearInterval(timer);
  }, [waitMs]);

  let blocked: QuotaBlock | null = null;
  if (remaining === 0) blocked = isLoggedIn ? 'member-daily' : 'guest-daily';
  else if (waitMs > 0) blocked = 'interval';

  /** 만들기를 눌렀을 때 한 번 세요. */
  const consume = useCallback(() => {
    const today = todayString();
    usageStore.set((prev) => ({
      date: today,
      count: (prev.date === today ? prev.count : 0) + 1,
      lastByCompany: { ...prev.lastByCompany, [stockCode]: Date.now() },
    }));
    setNow(Date.now());
  }, [stockCode]);

  return {
    limit,
    remaining,
    blocked,
    /** interval 로 막혔을 때 남은 분 (올림) */
    waitMinutes: Math.max(0, Math.ceil(waitMs / MINUTE)),
    consume,
  };
}

export type ReportQuota = ReturnType<typeof useReportQuota>;
