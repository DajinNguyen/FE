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
