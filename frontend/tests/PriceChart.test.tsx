import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { PriceChart } from '../src/components/PriceChart';
import { CompanyPage } from '../src/pages/CompanyPage';
import { getTrend, getTrendColor } from '../src/utils/trend';
import { renderWithProviders } from './testUtils';

const points = (...closes: number[]) =>
  closes.map((close, i) => ({ date: `2026-10-${String(i + 1).padStart(2, '0')}`, close }));

describe('주가 흐름 그래프 색', () => {
  it('시작보다 오르면 빨강, 내리면 파랑, 같으면 회색이에요', () => {
    expect(getTrend(100, 120)).toBe('rise');
    expect(getTrend(100, 80)).toBe('fall');
    expect(getTrend(100, 100)).toBe('flat');
    expect(getTrendColor(points(100, 90, 120))).toBe('var(--rise)');
    expect(getTrendColor(points(100, 130, 80))).toBe('var(--fall)');
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

    await user.click(screen.getByRole('radio', { name: '1년' }));
    const after = await screen.findByRole('img', { name: /주가 흐름/ });
    const label = after.getAttribute('aria-label') ?? '';
    const [from, to] = [...label.matchAll(/([\d,]+)원/g)].map((m) =>
      Number(m[1].replaceAll(',', '')),
    );
    const expected = to > from ? 'rise' : to < from ? 'fall' : 'flat';
    expect(after).toHaveAttribute('data-trend', expected);
  });
});
