/** 기간 동안의 방향: 시작 가격보다 마지막 가격이 높으면 rise, 낮으면 fall, 같으면 flat */
export type Trend = 'rise' | 'fall' | 'flat';

export function getTrend(first: number | undefined, last: number | undefined): Trend {
  if (first === undefined || last === undefined || first === last) return 'flat';
  return last > first ? 'rise' : 'fall';
}

/** 주가 그래프 공통 색 규칙: 상승 빨강, 하락 파랑, 같으면 회색 (디자인 토큰) */
export const trendColor: Record<Trend, string> = {
  rise: 'var(--rise)',
  fall: 'var(--fall)',
  flat: 'var(--text-3)',
};

/** 가격 목록의 처음과 끝을 비교해 그래프 색을 정해요. */
export function getTrendColor(points: { close: number }[]) {
  return trendColor[getTrend(points[0]?.close, points.at(-1)?.close)];
}

/** 기간 등락률 (%) */
export function getPeriodRate(points: { close: number }[]) {
  const first = points[0]?.close;
  const last = points.at(-1)?.close;
  if (!first || last === undefined) return undefined;
  return ((last - first) / first) * 100;
}
