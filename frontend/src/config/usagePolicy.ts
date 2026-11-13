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
} as const;

/**
 * 낱말퀴즈 완료 보상. ⚠️ 임시값, 확정 필요.
 * 퍼즐 3개를 [정답 보기] 없이 다 풀면 리포트 만들기 1회 추가, 보상은 하루 최대 2회, 로그인 사용자만.
 * (같은 퍼즐은 하루에 한 번만 세요. 실제 지급·악용 방지는 서버가 판단해요)
 */
export const PUZZLE_REWARD = {
  /** 보상 1회에 필요한 퍼즐 수 */
  puzzlesPerReward: 3,
  /** 하루 최대 보상 횟수 */
  dailyMax: 2,
  membersOnly: true,
  /** 날짜가 바뀌어도 다음 보상까지 센 퍼즐 수(예: 2/3)를 남길지. (오늘 보상 횟수는 항상 0부터) ⚠️ 임시값 */
  keepProgressAcrossDays: true,
} as const;

/** 메인·횟수 소진 안내에 쓰는 보상 문구 */
export const PUZZLE_REWARD_TEXT = `낱말퀴즈 ${PUZZLE_REWARD.puzzlesPerReward}개를 풀면 AI 리포트를 한 번 더 만들 수 있어요`;

/** 하루 만들기 횟수 제한이 있을 때만 보상 안내를 보여줘요. (지금은 임시로 무제한) */
export const hasDailyLimit = () => Number.isFinite(USAGE_POLICY.memberDailyReports);
