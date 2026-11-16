/** 앰똥깡(ADK) 지갑 — GET /api/me/wallet */
export interface Wallet {
  balance: number;
  /** 다음 보상까지 낱말퀴즈 진행 (done/required) */
  puzzle_progress: PuzzleProgress;
  /** 오늘 받은 낱말퀴즈 보상 횟수 */
  reward_count_today: number;
  /** 하루 최대 보상 횟수 */
  reward_daily_limit: number;
  /** 최근 내역 (최신 순) */
  history: WalletHistoryItem[];
}

export interface PuzzleProgress {
  done: number;
  required: number;
}

export interface WalletHistoryItem {
  id: string;
  type: 'earn' | 'spend';
  /** 양수 (type 으로 획득·사용을 구분해요) */
  amount: number;
  /** 화면에 그대로 보여줄 이유 (예: "낱말퀴즈 보상", "AI 리포트 · 삼성전자") */
  reason: string;
  /** ISO 시각 */
  created_at: string;
}

/** POST /api/me/puzzle-completions 응답 */
export interface PuzzleCompletionResult {
  puzzle_progress: PuzzleProgress;
  /** 이번 완료로 20 ADK 를 받았는지 */
  rewarded: boolean;
  balance: number;
  reward_count_today: number;
  reward_daily_limit: number;
}
