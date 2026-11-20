import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { PriceChart } from '../src/components/PriceChart';
import { CompanyPage } from '../src/pages/CompanyPage';
import { getTrend, getTrendColor } from '../src/utils/trend';
import { renderWithProviders } from './testUtils';

const points = (...closes: number[]) =>
  closes.map((close, i) => ({
    date: `2026-10-${String(i + 1).padStart(2, '0')}`,
    open: close,
    high: close,
    low: close,
    close,
  }));

describe('오늘 캔들 등락률 기준', () => {
  it('일 캔들의 마지막은 전일 종가(위쪽 현재가와 같은 기준)로, 없으면 앞 캔들 종가로 계산해요', () => {
    const { rerender } = render(
      <PriceChart points={points(100, 110)} interval="day" previousClose={105} />,
    );
    // 110 vs 전일 종가 105 → +4.76% (앞 캔들 종가 100 기준이면 +10.00%)
    expect(screen.getByTestId('price-info')).toHaveTextContent('종가 110원 (+4.76%)');
    rerender(<PriceChart points={points(100, 110)} interval="day" />);
    expect(screen.getByTestId('price-info')).toHaveTextContent('종가 110원 (+10.00%)');
  });
});

describe('주가 흐름 그래프 색', () => {
  it('시작보다 오르면 빨강, 내리면 파랑, 같으면 회색이에요', () => {
    expect(getTrend(100, 120)).toBe('rise');
    expect(getTrend(100, 80)).toBe('fall');
    expect(getTrend(100, 100)).toBe('flat');
    expect(getTrendColor(points(100, 90, 120))).toBe('var(--rise-line)');
    expect(getTrendColor(points(100, 130, 80))).toBe('var(--fall-line)');
    expect(getTrendColor(points(100, 150, 100))).toBe('var(--text-3)');
  });

  it('그래프에 같은 규칙의 방향이 붙어요', () => {
    const { rerender } = render(<PriceChart points={points(100, 120)} />);
    expect(screen.getByRole('img')).toHaveAttribute('data-trend', 'rise');
    rerender(<PriceChart points={points(100, 90)} />);
    expect(screen.getByRole('img')).toHaveAttribute('data-trend', 'fall');
    rerender(<PriceChart points={points(100, 100)} />);
    expect(screen.getByRole('img')).toHaveAttribute('data-trend', 'flat');
  });

  it('기간을 바꾸면 그 기간의 처음·끝으로 색을 다시 계산해요', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/companies/:stockCode" element={<CompanyPage />} />
      </Routes>,
      { route: '/companies/005930' },
    );
    const chart = await screen.findByRole('img', { name: /주가 흐름/ });
    const before = chart.getAttribute('data-trend');
    expect(['rise', 'fall', 'flat']).toContain(before);

    await user.click(screen.getByRole('radio', { name: '주' }));
    const after = await screen.findByRole('img', { name: /주가 흐름/ });
    const label = after.getAttribute('aria-label') ?? '';
    const [from, to] = [...label.matchAll(/([\d,]+)원/g)].map((m) =>
      Number(m[1].replaceAll(',', '')),
    );
    const expected = to > from ? 'rise' : to < from ? 'fall' : 'flat';
    expect(after).toHaveAttribute('data-trend', expected);
  });
});
