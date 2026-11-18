/** 주가 캔들 그래프의 눈금·크기 계산 (PriceChart) */

/** 가격 눈금: 범위를 3~4칸으로 나누는 1·2·2.5·5 단위의 딱 떨어지는 값들 */
export function priceTicks(min: number, max: number) {
  const raw = (max - min) / 4;
  const magnitude = 10 ** Math.floor(Math.log10(raw || 1));
  const unit = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((u) => u >= raw) ?? raw;
  const ticks = [];
  for (let v = Math.ceil(min / unit) * unit; v <= max; v += unit) ticks.push(v);
  return ticks;
}

/** 글자 하나 폭 (px, --fs-xs 숫자 기준 넉넉히) */
const CHAR_WIDTH = 7.5;

/** 오른쪽 가격 칸 폭: 가장 긴 가격 글자("1,450,000")와 현재가 표시가 들어가게 */
export function priceAxisWidth(maxPrice: number) {
  const chars = Math.round(maxPrice).toLocaleString('ko-KR').length;
  return Math.max(60, Math.ceil(chars * CHAR_WIDTH + 16));
}

/**
 * 현재가 표시(높이 18px)와 겹치는 가격 눈금은 빼요.
 * plotHeight: 그래프 안쪽 높이(px), domain: [아래, 위] 가격
 */
export function ticksAwayFrom(
  ticks: number[],
  price: number,
  domain: [number, number],
  plotHeight: number,
  minGapPx = 16,
) {
  const pxPerWon = plotHeight / (domain[1] - domain[0] || 1);
  return ticks.filter((t) => Math.abs(t - price) * pxPerWon >= minGapPx);
}

/** 날짜 눈금: 처음·끝을 포함해 같은 간격으로 count 개 */
export function evenDateTicks(dates: string[], count = 5) {
  if (dates.length <= count) return dates;
  const step = (dates.length - 1) / (count - 1);
  return [...new Set(Array.from({ length: count }, (_, i) => dates[Math.round(i * step)]))];
}
