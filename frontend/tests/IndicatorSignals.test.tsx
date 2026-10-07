import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { IndicatorSignals } from '../src/features/financials/IndicatorSignals';
import { buildIndicators } from '../src/features/financials/indicators';
import type { Financials } from '../src/types';
import { renderWithProviders } from './testUtils';

const baseFinancials: Financials = {
  stock_code: '005930',
  unit: '조 원',
  basis: '연결 기준',
  source: '테스트',
  annual: [
    { fiscal_year: 2023, revenue: 258.94, operating_income: 6.57 },
    { fiscal_year: 2024, revenue: 300.9, operating_income: 32.7 },
    { fiscal_year: 2025, revenue: 333.6, operating_income: 43.6 },
  ],
  latest_quarter: { label: '2025년 4분기', revenue: 93.8, operating_income: 20.1, note: '' },
  segments: { base_label: '', items: [] },
  indicators: {
    roe: { value: 9.2, is_sample: true },
    debt_ratio: { value: 27.1, is_sample: true },
    per: { value: 18.5, is_sample: true },
    pbr: { value: 1.9, is_sample: true },
  },
};

const card = (id: string) => within(screen.getByTestId(`indicator-${id}`));

describe('지표 신호등', () => {
  it('매출 증가율·영업이익률을 원본 숫자로 계산하고 상태 배지를 보여줘요', () => {
    renderWithProviders(<IndicatorSignals indicators={buildIndicators(baseFinancials)} />);

    // (333.6 - 300.9) / 300.9 = 10.87% → 좋음
    expect(card('revenue_growth').getByText('10.9%')).toBeInTheDocument();
    expect(card('revenue_growth').getByText('좋음')).toBeInTheDocument();

    // 43.6 / 333.6 = 13.07% → 좋음, "100원어치 팔면 약 13원"
    expect(card('operating_margin').getByText('13.1%')).toBeInTheDocument();
    expect(card('operating_margin').getByText('좋음')).toBeInTheDocument();
    expect(
      card('operating_margin').getByText('100원어치 팔면 약 13원을 남겼어요.'),
    ).toBeInTheDocument();

    expect(card('roe').getByText('보통')).toBeInTheDocument();
    expect(card('debt_ratio').getByText('좋음')).toBeInTheDocument();
    expect(card('per').getByText('보통')).toBeInTheDocument();
  });

  it('예시 값에는 "예시 값" 배지를, 계산 값에는 배지를 붙이지 않아요', () => {
    renderWithProviders(<IndicatorSignals indicators={buildIndicators(baseFinancials)} />);

    expect(card('roe').getByText('예시 값')).toBeInTheDocument();
    expect(card('revenue_growth').queryByText('예시 값')).not.toBeInTheDocument();
  });

  it('매출이 줄고 이익률이 낮으면 주의로 표시해요', () => {
    const weak: Financials = {
      ...baseFinancials,
      annual: [
        { fiscal_year: 2024, revenue: 100, operating_income: 8 },
        { fiscal_year: 2025, revenue: 90, operating_income: 3 },
      ],
      indicators: { ...baseFinancials.indicators, debt_ratio: { value: 250, is_sample: true } },
    };
    renderWithProviders(<IndicatorSignals indicators={buildIndicators(weak)} />);

    expect(card('revenue_growth').getByText('주의')).toBeInTheDocument();
    expect(card('revenue_growth').getByText('작년보다 매출이 10% 줄었어요.')).toBeInTheDocument();
    expect(card('operating_margin').getByText('주의')).toBeInTheDocument();
    expect(card('debt_ratio').getByText('주의')).toBeInTheDocument();
  });
});
