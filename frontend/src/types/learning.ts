/** 용어별 학습 상태: 처음 · 익히는 중 · 외웠어요 */
export type TermStatus = 'new' | 'learning' | 'mastered';

export interface TermProgressItem {
  status: TermStatus;
  correct_count: number;
  wrong_count: number;
  /** ISO 시각 */
  last_studied_at: string | null;
  /** 용어가 속한 세트(분류) id. 예: "basic" */
  set_id: string;
}

/** GET·PUT /api/me/term-progress — 로그인 사용자의 학습 기록 (PUT 은 전체를 한 번에 저장) */
export interface TermProgress {
  /** 용어 id → 기록 */
  terms: Record<string, TermProgressItem>;
  /** 세트(분류)별 진행률. 전체 용어 수는 서버가 알고 있어서 외운 수·학습한 수만 보내요. */
  set_progress: { set_id: string; mastered: number; studied: number }[];
  /** 학습한 날 (YYYY-MM-DD, 최근 60일). 연속 학습일 계산에 써요. */
  study_dates: string[];
}

/** 낱말퀴즈 완료 기록 하나 */
export interface PuzzleCompletion {
  puzzle_id: string;
  /** ISO 시각 */
  completed_at: string;
  /** [정답 보기]를 썼는지 (썼으면 보상 개수에 넣지 않아요) */
  revealed: boolean;
}

/** GET /api/me/usage-credits, POST /api/me/puzzle-completions 응답 — 낱말퀴즈 보상 */
export interface UsageCredits {
  /** 오늘 보상 횟수의 기준 날짜 (YYYY-MM-DD) */
  date: string;
  /** 오늘 받은 보상 횟수 (리포트 만들기 +1 씩) */
  rewards_today: number;
  /** 다음 보상까지 센 퍼즐 수 (0~2) */
  progress: number;
  /** 오늘 개수에 넣은 퍼즐 id (같은 퍼즐은 하루 한 번) */
  counted_today: string[];
  /** 최근 완료 기록 (최근 50개). synced 는 프론트에서만 써요 (서버에 아직 못 보낸 기록이면 false) */
  completions: (PuzzleCompletion & { synced?: boolean })[];
}
