/** 128500 → "128,500원" */
export function formatPrice(value: number) {
  return `${value.toLocaleString('ko-KR')}원`;
}

/** 258.94 → "258.94조 원", 44 → "44.0조 원" */
export function formatTrillion(value: number, fractionDigits: { min?: number; max?: number } = {}) {
  const { min = 1, max = 2 } = fractionDigits;
  return `${value.toLocaleString('ko-KR', { minimumFractionDigits: min, maximumFractionDigits: max })}조 원`;
}

/** 1.82 → "+1.82%" */
export function formatSignedPercent(value: number, digits = 2) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(digits)}%`;
}

export function formatPercent(value: number, digits = 1) {
  return `${value.toFixed(digits)}%`;
}

/** 거래대금(억 원) → "2.1조 원" / "9,820억 원" */
export function formatTradingValue(eok: number) {
  return eok >= 10_000
    ? `${(eok / 10_000).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}조 원`
    : `${eok.toLocaleString('ko-KR')}억 원`;
}

/**
 * 날짜 글자를 "10월 16일" 처럼 짧게 바꿔요. 시각이 15:30 이후면 "장 마감"을 붙여요.
 * "2026-10-16 15:30" → "10월 16일 장 마감" / "2026-10-16" → "10월 16일"
 * 형식을 알 수 없으면 받은 글자를 그대로 돌려줘요.
 */
export function formatMarketDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/.exec(value);
  if (!match) return value;
  const [, , month, day, hour, minute] = match;
  const date = `${Number(month)}월 ${Number(day)}일`;
  if (hour === undefined) return date;
  const afterClose = Number(hour) * 60 + Number(minute) >= 15 * 60 + 30;
  return afterClose ? `${date} 장 마감` : `${date} ${hour}:${minute}`;
}

/**
 * 기사·글 시각을 쉽게: "방금 전", "15분 전", "3시간 전", 하루가 넘으면 "10월 19일"
 * (올해가 아니면 "2025년 10월 19일"). 읽을 수 없는 값은 그대로 돌려줘요.
 */
export function formatRelativeTime(iso: string, now: Date = new Date()) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (diffMs >= 0 && minutes < 1) return '방금 전';
  if (diffMs >= 0 && minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (diffMs >= 0 && hours < 24) return `${hours}시간 전`;
  const sameYear = date.getFullYear() === now.getFullYear();
  return `${sameYear ? '' : `${date.getFullYear()}년 `}${date.getMonth() + 1}월 ${date.getDate()}일`;
}
