/**
 * AI 리포트 이용 제한 정책.
 * ⚠️ 임시값, PM 확정 필요. 정책이 정해지면 이 파일 한 곳만 바꾸면 돼요.
 * 이미 만들어진 리포트를 보는 건 제한하지 않아요. (만들기·다시 만들기에만 적용)
 */
export const USAGE_POLICY = {
  /** 로그인하지 않은 사용자가 하루에 만들 수 있는 리포트 수 */
  guestDailyReports: 1,
  /** 로그인한 사용자가 하루에 만들 수 있는 리포트 수 */
  memberDailyReports: 3,
  /** 같은 기업 리포트를 다시 만들 수 있는 간격 (분) */
  regenerateIntervalMinutes: 10,
} as const;
