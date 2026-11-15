/**
 * 막대 길이 비율 (0~1). 값의 크기 ÷ 같은 그래프의 최댓값.
 * 모든 막대 그래프(개요 사업별 매출, 재무 상세 분기·사업별)가 이 함수 하나로 길이를 정해요.
 * 음수(적자)도 크기로 비율을 내고, 방향(0 기준선 반대쪽)은 그리는 쪽에서 정해요.
 */
export function scaleBar(value: number, max: number) {
  if (!(max > 0) || !Number.isFinite(value)) return 0;
  return Math.min(Math.abs(value) / max, 1);
}

/** 막대 길이(px). 비율 × 전체 길이, 0 이 아닌 아주 작은 값만 최소 1px */
export function barLength(value: number, max: number, length: number) {
  const px = scaleBar(value, max) * length;
  return value !== 0 && px < 1 ? 1 : px;
}

/** 축 눈금: 0 부터 최댓값까지 보기 좋은 간격 (예: 0, 25, 50, 75) */
export function niceTicks(max: number, count = 4) {
  if (!(max > 0)) return [0];
  const raw = max / count;
  const power = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * power).find((s) => s >= raw) ?? raw;
  const ticks: number[] = [];
  for (let t = 0; t <= max + 1e-9; t += step) ticks.push(Math.round(t * 1e6) / 1e6);
  return ticks;
}
