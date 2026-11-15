import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { placeLabels, QuarterlyChart } from '../src/features/financials/QuarterlyChart';

const num = (el: Element, prop: 'bottom' | 'top' | 'height') =>
  parseFloat((el as HTMLElement).style[prop]);

const renderChart = () =>
  render(
    <QuarterlyChart
      unit="조 원"
      data={[
        { quarter: '25.1Q', revenue: 79.1, operating_income: 6.7, operating_margin: 8.5 },
        { quarter: '25.2Q', revenue: 74.6, operating_income: -4.7, operating_margin: -6.3 },
        { quarter: '25.3Q', revenue: 40, operating_income: 38, operating_margin: 95 },
      ]}
    />,
  );

describe('그래프 숫자 라벨 위치', () => {
  it('세로 막대 라벨은 막대 끝에서 4~6px 떨어져 막대 끝을 따라가요 (적자는 아래쪽)', () => {
    const { container } = renderChart();
    const slots = container.querySelectorAll('[data-bar]');
    slots.forEach((bar) => {
      const label = bar.parentElement!.querySelector('[data-label]')!;
      if (label.getAttribute('data-place') !== 'outside') return;
      const up = (bar as HTMLElement).style.bottom !== '';
      const gap = up
        ? num(label, 'bottom') - (num(bar, 'bottom') + num(bar, 'height'))
        : num(label, 'top') - (num(bar, 'top') + num(bar, 'height'));
      expect(gap).toBeGreaterThanOrEqual(4);
      expect(gap).toBeLessThanOrEqual(6);
    });
  });

  it('두 막대 끝 높이가 비슷해 라벨이 겹치면 짧은 막대 라벨을 막대 안쪽 끝에 넣어요', () => {
    const { container } = renderChart();
    const income = container.querySelectorAll('[data-label="income"]');
    expect(income[0]).toHaveAttribute('data-place', 'outside');
    expect(income[2]).toHaveAttribute('data-place', 'inside');
    const bar = income[2].parentElement!.querySelector('[data-bar]')!;
    const inset = num(bar, 'bottom') + num(bar, 'height') - num(income[2], 'bottom');
    expect(inset).toBeGreaterThan(0);
    expect(inset).toBeLessThanOrEqual(5 + 13);
  });

  it('겹치지 않거나, 막대가 라벨보다 짧으면 밖에 둬요', () => {
    expect(placeLabels(160, 20)).toEqual(['outside', 'outside']);
    expect(placeLabels(160, -20)).toEqual(['outside', 'outside']);
    expect(placeLabels(160, 150)).toEqual(['outside', 'inside']);
    expect(placeLabels(10, 5)).toEqual(['outside', 'outside']);
  });
});
