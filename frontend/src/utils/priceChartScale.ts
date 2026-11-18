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

/** 이동평균선 기간 (캔들 수). 4개 이상은 선끼리 구분이 어려워서 3개만 (dataviz 팔레트 검증) */
export const MA_WINDOWS = [5, 20, 60] as const;

/** 단순 이동평균. 앞쪽 (n−1)개는 계산할 수 없어서 null */
export function movingAverage(values: number[], n: number): (number | null)[] {
  const out: (number | null)[] = [];
  let sum = 0;
  values.forEach((v, i) => {
    sum += v;
    if (i >= n) sum -= values[i - n];
    out.push(i >= n - 1 ? sum / n : null);
  });
  return out;
}

/** 기간 중 최고가(고가)·최저가(저가) 캔들 위치. 같으면 최근 것 */
export function extremeIndexes(points: { high: number; low: number }[]) {
  let high = 0;
  let low = 0;
  points.forEach((p, i) => {
    if (p.high >= points[high].high) high = i;
    if (p.low <= points[low].low) low = i;
  });
  return { high, low };
}

/** 거래량: 1억 이상 "1.2억", 1만 이상 "35.4만", 그 아래는 쉼표 */
export function formatVolume(value: number) {
  if (value >= 1e8)
    return `${(value / 1e8).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}억`;
  if (value >= 1e4)
    return `${(value / 1e4).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}만`;
  return value.toLocaleString('ko-KR');
}

/** base 대비 value 의 변화율 (%). base 가 없거나 0 이면 null */
export const changeRate = (value: number, base: number | undefined) =>
  base ? ((value - base) / base) * 100 : null;
