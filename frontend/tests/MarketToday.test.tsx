import { screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { IndexChange } from '../src/features/market/MarketIndexes';
import { MarketToday, SERVICE_INTRO } from '../src/features/market/MarketToday';
import { HomePage } from '../src/pages/HomePage';
import type { MarketIndex } from '../src/types';
import { renderWithProviders } from './testUtils';

const index = (change: number, change_rate: number): MarketIndex => ({
  code: 'KOSPI',
  value: 2684.32,
  change,
  change_rate,
  is_sample: true,
});

afterEach(() => {
  window.history.replaceState(null, '', '/');
});

describe('메인 오늘의 시장', () => {
  it('상승은 ▲와 "상승", 하락은 ▼와 "하락"으로 표시해요', () => {
    const { rerender } = renderWithProviders(<IndexChange index={index(31.2, 1.18)} />);
    let change = screen.getByText(/31\.20/);
    expect(change).toHaveAttribute('data-direction', 'rise');
    expect(change).toHaveTextContent('▲');
    expect(change).toHaveTextContent('어제보다 상승');
    expect(change).toHaveTextContent('(+1.18%)');

    rerender(<IndexChange index={index(-2.1, -0.26)} />);
    change = screen.getByText(/2\.10/);
    expect(change).toHaveAttribute('data-direction', 'fall');
    expect(change).toHaveTextContent('▼');
    expect(change).toHaveTextContent('(-0.26%)');
  });

  it('한마디 아래에 기준 시각과 AI 정리 안내, 지수와 예시 값 배지를 보여줘요', async () => {
    renderWithProviders(<MarketToday />);
    expect(await screen.findByText(SERVICE_INTRO)).toBeInTheDocument();
    expect(
      await screen.findByText(/기준 · AI가 뉴스와 지수를 바탕으로 정리했어요/),
    ).toBeInTheDocument();
    const indexes = screen.getByLabelText('시장 지수');
    expect(within(indexes).getByText('코스피')).toBeInTheDocument();
    expect(within(indexes).getByText('코스닥')).toBeInTheDocument();
    expect(within(indexes).getAllByText('예시 값').length).toBeGreaterThan(0);
  });

  it('오늘 시장이 왜 움직였는지 이유 3개와 근거 뉴스, 산업 페이지로 가는 산업 칩을 보여줘요', async () => {
    renderWithProviders(<MarketToday />);
    const section = await screen.findByRole('region', {
      name: '오늘 시장이 왜 이렇게 움직였나요?',
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
    const news = within(section).getAllByRole('link');
    expect(news[0]).toHaveAttribute('target', '_blank');
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
