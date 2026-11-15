import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HorizontalBars } from '../src/components/HorizontalBars';
import { BAR_AREA, QuarterlyChart } from '../src/features/financials/QuarterlyChart';
import { barLength, niceTicks, scaleBar } from '../src/utils/scaleBar';

const px = (el: Element) => parseFloat((el as HTMLElement).style.height);

describe('막대 길이 = 값 비율 (scaleBar)', () => {
  it('0 부터 시작하고 같은 최댓값 기준이라 두 막대 길이 비율이 값 비율과 같아요', () => {
    expect(scaleBar(0, 100)).toBe(0);
    expect(scaleBar(100, 100)).toBe(1);
    const a = barLength(93.8, 93.8, BAR_AREA);
    const b = barLength(20.1, 93.8, BAR_AREA);
    expect(Math.abs(b - (a * 20.1) / 93.8)).toBeLessThanOrEqual(1);
  });

  it('0 이 아닌 아주 작은 값만 최소 1px, 음수는 크기로 비율을 내요', () => {
    expect(barLength(0.001, 100, 180)).toBe(1);
    expect(barLength(0, 100, 180)).toBe(0);
    expect(scaleBar(-50, 100)).toBe(0.5);
    expect(scaleBar(10, 0)).toBe(0);
  });

  it('축 눈금은 0 부터 보기 좋은 간격이에요', () => {
    expect(niceTicks(93.8)).toEqual([0, 25, 50, 75]);
  });

  it('분기 그래프: 매출·영업이익이 같은 축, 비율이 값과 같고(1px 이내) 적자는 기준선 아래로', () => {
    const { container } = render(
      <QuarterlyChart
        unit="조 원"
        data={[
          { quarter: '25.1Q', revenue: 80, operating_income: 20, operating_margin: 25 },
          { quarter: '25.2Q', revenue: 40, operating_income: -10, operating_margin: -25 },
        ]}
      />,
    );
    const revenue = container.querySelectorAll('[data-bar="revenue"]');
    const income = container.querySelectorAll('[data-bar="income"]');
    // 범위 = 80 - (-10) = 90 → 막대 영역 180px 를 같은 비율로 나눠요
    expect(px(revenue[0])).toBeCloseTo((80 / 90) * BAR_AREA, 0);
    expect(Math.abs(px(revenue[1]) - px(revenue[0]) / 2)).toBeLessThanOrEqual(1);
    expect(Math.abs(px(income[0]) - px(revenue[0]) / 4)).toBeLessThanOrEqual(1);
    // 흑자는 아래쪽(bottom)에 붙어 위로, 적자는 기준선(top)에서 아래로
    expect((income[0] as HTMLElement).style.bottom).not.toBe('');
    expect((income[1] as HTMLElement).style.top).not.toBe('');
    // 기준선 = 위 라벨 자리 22px + 흑자 영역 (80/90) × 180px
    expect((income[1] as HTMLElement).style.top).toBe(`${22 + (80 / 90) * BAR_AREA}px`);
  });

  it('사업별 매출 막대도 같은 함수로 가장 큰 사업 대비 비율이에요', () => {
    render(
      <HorizontalBars
        data={[
          { id: 'a', label: 'A', value: 44 },
          { id: 'b', label: 'B', value: 11 },
        ]}
        formatValue={(v) => `${v}`}
      />,
    );
    expect(screen.getByText('A').closest('li')!.querySelector('[data-bar]')).toHaveStyle({
      width: '100%',
    });
    expect(screen.getByText('B').closest('li')!.querySelector('[data-bar]')).toHaveStyle({
      width: '25%',
    });
  });
});
