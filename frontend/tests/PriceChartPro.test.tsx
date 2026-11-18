import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PriceChart } from '../src/components/PriceChart';
import type { PricePoint } from '../src/types';
import {
  changeRate,
  extremeIndexes,
  formatVolume,
  movingAverage,
} from '../src/utils/priceChartScale';

/** 하루씩 이어지는 캔들 (종가 목록으로) */
const candles = (closes: number[], volume = true): PricePoint[] =>
  closes.map((close, i) => {
    const d = new Date(Date.UTC(2026, 6, 1 + i));
    return {
      date: d.toISOString().slice(0, 10),
      open: close - 100,
      high: close + 200,
      low: close - 300,
      close,
      ...(volume ? { volume: 1_000_000 + i } : {}),
    };
  });

const info = () => screen.getByTestId('price-info');

describe('주가 그래프 계산', () => {
  it('이동평균은 앞쪽 (n−1)개가 비어요', () => {
    expect(movingAverage([1, 2, 3, 4, 5], 3)).toEqual([null, null, 2, 3, 4]);
  });

  it('최고가·최저가 위치 (같으면 최근 것)', () => {
    const pts = [
      { high: 10, low: 5 },
      { high: 12, low: 4 },
      { high: 12, low: 4 },
    ];
    expect(extremeIndexes(pts)).toEqual({ high: 2, low: 2 });
  });

  it('거래량은 만·억 단위로', () => {
    expect(formatVolume(8200)).toBe('8,200');
    expect(formatVolume(3_734_000)).toBe('373.4만');
    expect(formatVolume(123_000_000)).toBe('1.2억');
    expect(changeRate(110, 100)).toBeCloseTo(10);
    expect(changeRate(1, 0)).toBeNull();
  });
});

describe('주가 그래프 (증권 앱처럼)', () => {
  it('위쪽에 마지막 날의 시가·고가·저가·종가(전날 대비)와 거래량을 보여줘요', () => {
    render(<PriceChart points={candles([1000, 1100])} />);
    expect(info()).toHaveTextContent('2026.07.02');
    expect(info()).toHaveTextContent('종가 1,100원 (+10.00%)');
    expect(info()).toHaveTextContent('시가 1,000원 (0.00%)');
    expect(info()).toHaveTextContent('거래량 100만');
  });

  it('왼쪽·오른쪽 키로 날짜를 옮기면 그날 가격이 나와요', async () => {
    const user = userEvent.setup();
    render(<PriceChart points={candles([1000, 1100, 1200])} />);
    await user.tab();
    expect(screen.getByRole('img')).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(info()).toHaveTextContent('2026.07.02');
    await user.keyboard('{Home}');
    expect(info()).toHaveTextContent('2026.07.01');
    // 첫날은 전날이 없어서 % 가 없어요
    expect(info()).not.toHaveTextContent('%');
  });

  it('이동평균선은 기간의 2배 이상 캔들이 있을 때만 (60일선은 120개부터)', () => {
    const { container, rerender } = render(
      <PriceChart points={candles(Array.from({ length: 63 }, (_, i) => 1000 + i))} />,
    );
    const lines = () =>
      [...container.querySelectorAll('[data-ma]')].map((e) => e.getAttribute('data-ma'));
    expect(lines()).toEqual(['5', '20']);
    expect(info()).toHaveTextContent('이동평균선(일)');

    rerender(<PriceChart points={candles(Array.from({ length: 125 }, (_, i) => 1000 + i))} />);
    expect(lines()).toEqual(['5', '20', '60']);
  });

  it('기간 중 최고가·최저가를 지금 가격 대비 %와 날짜로 표시해요', () => {
    const { container } = render(<PriceChart points={candles([1000, 2000, 1500])} />);
    // 최고 = 2000+200 = 2200 (07.02), 지금 1500 → -31.82%
    expect(container.querySelector('[data-mark="high"]')).toHaveTextContent(
      '최고 2,200원 (-31.82%, 07.02)',
    );
    // 최저 = 1000-300 = 700 (07.01), 지금 1500 → +114.29%
    expect(container.querySelector('[data-mark="low"]')).toHaveTextContent(
      '최저 700원 (+114.29%, 07.01)',
    );
  });

  it('거래량이 없으면 거래량 막대를 그리지 않아요 (백엔드가 아직 안 줄 때)', () => {
    const { container, rerender } = render(<PriceChart points={candles([1000, 1100])} />);
    expect(container.querySelector('[data-pane="volume"]')).not.toBeNull();
    rerender(<PriceChart points={candles([1000, 1100], false)} />);
    expect(container.querySelector('[data-pane="volume"]')).toBeNull();
    expect(within(info()).queryByText('거래량')).not.toBeInTheDocument();
  });
});
