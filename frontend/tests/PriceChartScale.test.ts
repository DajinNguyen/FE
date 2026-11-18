import { describe, expect, it } from 'vitest';
import {
  evenDateTicks,
  priceAxisWidth,
  priceTicks,
  ticksAwayFrom,
} from '../src/utils/priceChartScale';

describe('주가 그래프 눈금', () => {
  it('가격 눈금은 딱 떨어지는 값', () => {
    expect(priceTicks(111_000, 131_000)).toEqual([115_000, 120_000, 125_000, 130_000]);
  });

  it('현재가 표시와 겹치는 가격 눈금은 빼요', () => {
    // 그래프 높이 100px, 범위 20,000원 → 1px = 200원. 16px = 3,200원 안쪽은 빼요.
    expect(ticksAwayFrom([120_000, 125_000, 130_000], 128_500, [110_000, 130_000], 100)).toEqual([
      120_000, 125_000,
    ]);
    expect(ticksAwayFrom([120_000, 125_000, 130_000], 126_000, [110_000, 130_000], 100)).toEqual([
      120_000, 130_000,
    ]);
  });

  it('오른쪽 가격 칸은 100만 원이 넘는 가격도 들어갈 만큼 넓어요', () => {
    expect(priceAxisWidth(128_500)).toBeGreaterThanOrEqual(60);
    expect(priceAxisWidth(1_450_000)).toBeGreaterThan(priceAxisWidth(128_500));
  });

  it('날짜 눈금은 처음·끝 포함 같은 간격', () => {
    const dates = Array.from({ length: 21 }, (_, i) => `d${i}`);
    expect(evenDateTicks(dates, 5)).toEqual(['d0', 'd5', 'd10', 'd15', 'd20']);
    expect(evenDateTicks(['a', 'b'], 5)).toEqual(['a', 'b']);
  });
});
