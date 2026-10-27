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
  indicators_as_of: null,
  recent_performance: null,
  indicators: {
    roe: { value: 9.2, is_sample: true },
    debt_ratio: { value: 27.1, is_sample: true },
    per: { value: 18.5, is_sample: true },
    pbr: { value: 1.9, is_sample: true },
  },
};

const card = (id: string) => within(screen.getByTestId(`indicator-${id}`));

describe('지표 표현 (높은 편 / 보통 / 낮은 편)', () => {
  it('매출 증가율·영업이익률을 원본 숫자로 계산하고 높은 편·보통·낮은 편으로 보여줘요', () => {
    renderWithProviders(<IndicatorSignals indicators={buildIndicators(baseFinancials)} />);

    // (333.6 - 300.9) / 300.9 = 10.87% → 높은 편
    expect(card('revenue_growth').getByText('10.9%')).toBeInTheDocument();
    expect(card('revenue_growth').getByText('높은 편')).toBeInTheDocument();
    // 43.6 / 333.6 = 13.07% → 높은 편, "100원어치 팔면 약 13원"
    expect(card('operating_margin').getByText('13.1%')).toBeInTheDocument();
    expect(card('operating_margin').getByText('높은 편')).toBeInTheDocument();
    expect(
      card('operating_margin').getByText('100원어치 팔면 약 13원을 남겼어요.'),
    ).toBeInTheDocument();

    expect(card('roe').getByText('보통')).toBeInTheDocument();
    // 부채비율은 낮은 편이 안정적이에요.
    expect(card('debt_ratio').getByText('낮은 편 · 안정적')).toBeInTheDocument();
    expect(card('per').getByText('보통')).toBeInTheDocument();
    expect(screen.queryByText('좋음')).not.toBeInTheDocument();
    expect(screen.queryByText('주의')).not.toBeInTheDocument();
  });

  it('업종 중앙값이 있으면 비교 문장을 보여주고 그 기준으로 판단해요', () => {
    const withBenchmark: Financials = {
      ...baseFinancials,
      benchmarks: {
        operating_margin: {
          basis: 'sector_median',
          basis_value: 7.5,
          basis_label: '반도체 업종 중앙값',
        },
        roe: { basis: 'sector_median', basis_value: 9, basis_label: '반도체 업종 중앙값' },
      },
    };
    renderWithProviders(<IndicatorSignals indicators={buildIndicators(withBenchmark)} />);
    expect(
      card('operating_margin').getByText('반도체 업종 중앙값 7.5%보다 높은 편이에요'),
    ).toBeInTheDocument();
    expect(card('roe').getByText('반도체 업종 중앙값 9%와 비슷해요')).toBeInTheDocument();
  });

  it('"예시 값" 배지는 보여주지 않아요', () => {
    renderWithProviders(<IndicatorSignals indicators={buildIndicators(baseFinancials)} />);
    expect(card('roe').queryByText('예시 값')).not.toBeInTheDocument();
  });

  it('매출이 줄고 이익률이 낮으면 낮은 편, 부채가 많으면 높은 편으로 보여줘요', () => {
    const weak: Financials = {
      ...baseFinancials,
      annual: [
        { fiscal_year: 2024, revenue: 100, operating_income: 8 },
        { fiscal_year: 2025, revenue: 90, operating_income: 3 },
      ],
      indicators: { ...baseFinancials.indicators, debt_ratio: { value: 250, is_sample: true } },
    };
    renderWithProviders(<IndicatorSignals indicators={buildIndicators(weak)} />);

    expect(card('revenue_growth').getByText('낮은 편')).toBeInTheDocument();
    expect(card('revenue_growth').getByText('작년보다 매출이 10% 줄었어요.')).toBeInTheDocument();
    expect(card('operating_margin').getByText('낮은 편')).toBeInTheDocument();
    expect(card('debt_ratio').getByText('높은 편')).toBeInTheDocument();
  });
});

describe('지표 예외 처리', () => {
  const flags = { is_financial: false, is_loss: false, is_capital_impaired: false };

  it('금융업은 부채비율을 평가하지 않아요', () => {
    renderWithProviders(
      <IndicatorSignals
        indicators={buildIndicators({ ...baseFinancials, flags: { ...flags, is_financial: true } })}
      />,
    );
    expect(card('debt_ratio').getByText('평가 제외')).toBeInTheDocument();
    expect(card('debt_ratio').getByText(/금융회사는/)).toBeInTheDocument();
    expect(card('roe').getByText('보통')).toBeInTheDocument();
  });

  it('적자면 PER 을 "계산할 수 없어요"로 보여줘요', () => {
    renderWithProviders(
      <IndicatorSignals
        indicators={buildIndicators({ ...baseFinancials, flags: { ...flags, is_loss: true } })}
      />,
    );
    expect(card('per').getByText('계산할 수 없어요')).toBeInTheDocument();
    expect(card('per').getByText('평가 제외')).toBeInTheDocument();
  });

  it('자본잠식이면 ROE·부채비율을 평가하지 않아요', () => {
    renderWithProviders(
      <IndicatorSignals
        indicators={buildIndicators({
          ...baseFinancials,
          flags: { ...flags, is_capital_impaired: true },
        })}
      />,
    );
    expect(card('roe').getByText('평가 제외')).toBeInTheDocument();
    expect(card('debt_ratio').getByText('평가 제외')).toBeInTheDocument();
    expect(card('per').getByText('보통')).toBeInTheDocument();
  });
});
