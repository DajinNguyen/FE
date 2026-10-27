/**
 * AI 리포트 이용 제한 정책.
 * ⚠️ 임시값, PM 확정 필요. 정책이 정해지면 이 파일 한 곳만 바꾸면 돼요.
 * 이미 만들어진 리포트를 보는 건 제한하지 않아요. (만들기·다시 만들기에만 적용)
 */
export const USAGE_POLICY = {
  /** 로그인하지 않은 사용자가 하루에 만들 수 있는 리포트 수 */
  guestDailyReports: Infinity,
  /** 로그인한 사용자가 하루에 만들 수 있는 리포트 수 */
  memberDailyReports: Infinity,
  /** 같은 기업 리포트를 다시 만들 수 있는 간격 (분) */
  regenerateIntervalMinutes: 10,
} as const;

/**
 * 낱말퀴즈 완료 보상. ⚠️ 임시값, PM 확정 필요.
 * 퍼즐 1개를 [정답 보기] 없이 다 풀면 리포트 만들기 1회 추가, 하루 최대 2회, 로그인 사용자만.
 * (같은 퍼즐은 하루에 한 번만 보상해요)
 */
export const PUZZLE_REWARD = {
  perPuzzle: 1,
  dailyMax: 2,
  membersOnly: true,
} as const;

/** 하루 만들기 횟수 제한이 있을 때만 보상 안내를 보여줘요. (지금은 임시로 무제한) */
export const hasDailyLimit = () => Number.isFinite(USAGE_POLICY.memberDailyReports);
