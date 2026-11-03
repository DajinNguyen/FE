import { screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { IndexChange } from '../src/features/market/MarketIndexes';
import { MarketReasons } from '../src/features/market/MarketReasons';
import { MarketToday } from '../src/features/market/MarketToday';
import { HomePage } from '../src/pages/HomePage';
import type { MarketIndex } from '../src/types';
import { renderWithProviders } from './testUtils';

const index = (change: number, change_rate: number): MarketIndex => ({
  code: 'KOSPI',
  value: 2684.32,
  change,
  change_rate,
});

afterEach(() => {
  window.history.replaceState(null, '', '/');
});

describe('메인 오늘의 시장', () => {
  it('상승은 ▲와 "상승", 하락은 ▼와 "하락"으로 표시해요', () => {
    const { rerender } = renderWithProviders(<IndexChange index={index(31.2, 1.18)} />);
    let change = screen.getByText(/1\.18%/);
    expect(change).toHaveAttribute('data-direction', 'rise');
    expect(change).toHaveTextContent('▲');
    expect(change).toHaveTextContent('어제보다 상승');

    rerender(<IndexChange index={index(-2.1, -0.26)} />);
    change = screen.getByText(/0\.26%/);
    expect(change).toHaveAttribute('data-direction', 'fall');
    expect(change).toHaveTextContent('▼');
    expect(change).toHaveTextContent('어제보다 하락');
  });

  it('한마디·기준 시각 옆에 코스피·코스닥을 세로로 작게 보여주고, 그래프는 없어요', async () => {
    renderWithProviders(<MarketToday />);
    expect(await screen.findByText(/기준 · AI 정리$/)).toBeInTheDocument();
    const chips = within(screen.getByRole('list', { name: '시장 지수' })).getAllByRole('listitem');
    expect(chips.map((chip) => chip.textContent?.slice(0, 3))).toEqual(['코스피', '코스닥']);
    expect(within(screen.getByRole('list', { name: '시장 지수' })).queryByRole('img')).toBeNull();
  });

  it('오늘 시장이 왜 움직였는지 이유 3개와 근거 뉴스, 산업 페이지로 가는 산업 칩을 보여줘요', async () => {
    renderWithProviders(<MarketReasons />);
    const section = await screen.findByRole('region', {
      name: '오늘 시장, 왜 움직였나요?',
    });
    const reasons = within(section).getAllByRole('heading', { level: 3 });
    expect(reasons).toHaveLength(3);
    const chips = within(section).getAllByRole('list', { name: '관련 산업' })[0];
    expect(chips).toHaveTextContent('반도체');
    expect(chips).toHaveTextContent('상승2.1%');
    expect(within(chips).getByRole('link', { name: /반도체/ })).toHaveAttribute(
      'href',
      '/industries/semiconductor',
    );
    const [news] = within(section).getAllByRole('list', { name: /근거 뉴스/ });
    expect(within(news).getAllByRole('link')[0]).toHaveAttribute('target', '_blank');
  });

  it('시장 정보를 불러오지 못하면 안내를 보여주고, 검색창은 그대로 써요', async () => {
    window.history.replaceState(null, '', '/?mock_market=fail');
    renderWithProviders(<HomePage />);
    expect(
      await screen.findByRole('heading', { level: 1, name: '시장 정보를 불러오지 못했어요' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: '기업 검색' })).toBeEnabled();
  });
});
