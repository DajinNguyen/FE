import { useCallback, useMemo } from 'react';
import { getTermProgress, putTermProgress } from '../api/me';
import type { Term, TermProgress, TermProgressItem, TermStatus } from '../types';
import { localDate, shiftDate } from '../utils/date';
import { createSyncedRecord } from './syncedRecord';

/** 카드 학습의 [알았어요]·[다시 볼래요] */
export type TermMark = 'known' | 'review';

/** 연속 학습일 계산에 남겨 두는 날 수 */
const KEEP_DAYS = 60;

const emptyProgress: TermProgress = { terms: {}, set_progress: [], study_dates: [] };
const statusRank: Record<TermStatus, number> = { new: 0, learning: 1, mastered: 2 };

/** 더 진행된 기록: 상태가 앞선 쪽, 같으면 최근에 학습한 쪽. 맞힌·틀린 수는 큰 값 */
function mergeItem(a: TermProgressItem, b: TermProgressItem): TermProgressItem {
  const rank = statusRank[a.status] - statusRank[b.status];
  const newer = (a.last_studied_at ?? '') >= (b.last_studied_at ?? '') ? a : b;
  const ahead = rank > 0 ? a : rank < 0 ? b : newer;
  return {
    ...ahead,
    correct_count: Math.max(a.correct_count, b.correct_count),
    wrong_count: Math.max(a.wrong_count, b.wrong_count),
    last_studied_at: newer.last_studied_at,
  };
}

/** 기기 기록과 서버 기록을 용어별로 합쳐요. */
export function mergeTermProgress(server: TermProgress, local: TermProgress): TermProgress {
  const terms = { ...server.terms };
  for (const [id, item] of Object.entries(local.terms)) {
    terms[id] = terms[id] ? mergeItem(terms[id], item) : item;
  }
  return withSummary({
    terms,
    set_progress: [],
    study_dates: [...server.study_dates, ...local.study_dates],
  });
}

/** 세트별 진행률을 다시 세고, 학습한 날을 정리해요. */
function withSummary(progress: TermProgress): TermProgress {
  const sets = new Map<string, { set_id: string; mastered: number; studied: number }>();
  for (const item of Object.values(progress.terms)) {
    const set = sets.get(item.set_id) ?? { set_id: item.set_id, mastered: 0, studied: 0 };
    set.studied += 1;
    if (item.status === 'mastered') set.mastered += 1;
    sets.set(item.set_id, set);
  }
  const dates = [...new Set(progress.study_dates)].sort().slice(-KEEP_DAYS);
  return { ...progress, set_progress: [...sets.values()], study_dates: dates };
}

/** 예전 기기 기록({ 용어 id: "known" | "review" })을 새 형식으로 옮겨요. */
function migrateOldRecord() {
  try {
    const raw = window.localStorage.getItem('dajin:term-progress');
    if (!raw || window.localStorage.getItem('dajin:term-progress-v2')) return;
    const old = JSON.parse(raw) as Record<string, unknown>;
    if ('terms' in old) return;
    const terms: TermProgress['terms'] = {};
    for (const [id, mark] of Object.entries(old)) {
      terms[id] = {
        status: mark === 'known' ? 'mastered' : 'learning',
        correct_count: 0,
        wrong_count: 0,
        last_studied_at: null,
        set_id: 'unknown',
      };
    }
    window.localStorage.setItem(
      'dajin:term-progress-v2',
      JSON.stringify(withSummary({ ...emptyProgress, terms })),
    );
    window.localStorage.removeItem('dajin:term-progress');
  } catch {
    // 옮기지 못해도 새로 시작하면 돼요.
  }
}
migrateOldRecord();

const termProgressRecord = createSyncedRecord<TermProgress>({
  name: 'term-progress-v2',
  empty: emptyProgress,
  load: getTermProgress,
  save: putTermProgress,
  merge: mergeTermProgress,
  isEmpty: (p) => Object.keys(p.terms).length === 0,
});

/** 학습 기록 Provider (AppProviders 에 있어요) */
export const TermProgressProvider = termProgressRecord.Provider;

/** 연속 학습일: 오늘(오늘 아직 안 했으면 어제)부터 거꾸로 이어진 날 수 */
export function countStreak(studyDates: string[], today = localDate()) {
  const days = new Set(studyDates);
  let day = days.has(today) ? today : shiftDate(today, -1);
  let streak = 0;
  while (days.has(day)) {
    streak += 1;
    day = shiftDate(day, -1);
  }
  return streak;
}

/**
 * 용어 학습 기록. 로그인하면 서버에 저장해서 다른 기기에서도 이어서 학습해요.
 * 비로그인은 이 기기(localStorage)에만 저장해요.
 */
export function useTermProgress() {
  const { data, update, storage } = termProgressRecord.useRecord();

  const study = useCallback(
    (term: Pick<Term, 'id' | 'category'>, change: (item: TermProgressItem) => TermProgressItem) => {
      const now = new Date();
      update((prev) => {
        const item = prev.terms[term.id] ?? {
          status: 'new',
          correct_count: 0,
          wrong_count: 0,
          last_studied_at: null,
          set_id: term.category,
        };
        return withSummary({
          terms: {
            ...prev.terms,
            [term.id]: { ...change(item), last_studied_at: now.toISOString() },
          },
          set_progress: prev.set_progress,
          study_dates: [...prev.study_dates, localDate(now)],
        });
      });
    },
    [update],
  );

  /** 카드 학습: [알았어요] → 외웠어요, [다시 볼래요] → 익히는 중 */
  const mark = useCallback(
    (term: Pick<Term, 'id' | 'category'>, value: TermMark) =>
      study(term, (item) => ({ ...item, status: value === 'known' ? 'mastered' : 'learning' })),
    [study],
  );

  /** 문제 풀이: 맞히면 맞힌 수만, 틀리면 틀린 수 + 다시 익히는 중으로 */
  const recordAnswer = useCallback(
    (term: Pick<Term, 'id' | 'category'>, correct: boolean) =>
      study(term, (item) =>
        correct
          ? { ...item, correct_count: item.correct_count + 1 }
          : { ...item, wrong_count: item.wrong_count + 1, status: 'learning' },
      ),
    [study],
  );

  /** 진행 상황 초기화 (학습한 날은 남겨요) */
  const reset = useCallback(
    () => update((prev) => withSummary({ ...emptyProgress, study_dates: prev.study_dates })),
    [update],
  );

  const marks = useMemo(() => {
    const result: Record<string, TermMark> = {};
    for (const [id, item] of Object.entries(data.terms)) {
      if (item.status === 'mastered') result[id] = 'known';
      else if (item.status === 'learning') result[id] = 'review';
    }
    return result;
  }, [data]);

  const today = localDate();
  const stats = {
    mastered: Object.values(data.terms).filter((t) => t.status === 'mastered').length,
    today: Object.values(data.terms).filter(
      (t) => t.last_studied_at && localDate(new Date(t.last_studied_at)) === today,
    ).length,
    streak: countStreak(data.study_dates, today),
  };

  return { progress: data, marks, mark, recordAnswer, reset, stats, storage };
}
