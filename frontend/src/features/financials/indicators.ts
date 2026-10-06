import type { AnnualFinancial, Financials, Status } from '../../types';

export type IndicatorId = 'revenue_growth' | 'operating_margin' | 'roe' | 'debt_ratio' | 'per';

export interface Indicator {
  id: IndicatorId;
  label: string;
  value: number;
  display: string;
  status: Status;
  is_sample: boolean;
  /** 쉬운 설명 한 줄 (값에 따라 문장이 바뀌어요) */
  description: string;
  /** 판단 기준 한 줄 */
  criteria: string;
}

const round = (value: number, digits = 1) => Math.round(value * 10 ** digits) / 10 ** digits;

const latestTwo = (annual: AnnualFinancial[]) => {
  const sorted = [...annual].sort((a, b) => a.fiscal_year - b.fiscal_year);
  return { prev: sorted.at(-2), last: sorted.at(-1) };
};

/** 최신 연도 매출 증가율(%) = (올해 매출 - 작년 매출) / 작년 매출 × 100 */
export function calcRevenueGrowth(annual: AnnualFinancial[]) {
  const { prev, last } = latestTwo(annual);
  if (!prev || !last || prev.revenue === 0) return null;
  return ((last.revenue - prev.revenue) / prev.revenue) * 100;
}

/** 최신 연도 영업이익 증가율(%) */
export function calcOperatingIncomeGrowth(annual: AnnualFinancial[]) {
  const { prev, last } = latestTwo(annual);
  if (!prev || !last || prev.operating_income === 0) return null;
  return ((last.operating_income - prev.operating_income) / Math.abs(prev.operating_income)) * 100;
}

/** 최신 연도 영업이익률(%) = 영업이익 / 매출 × 100 */
export function calcOperatingMargin(annual: AnnualFinancial[]) {
  const { last } = latestTwo(annual);
  if (!last || last.revenue === 0) return null;
  return (last.operating_income / last.revenue) * 100;
}

/** 연도별 영업이익률(%) */
export function calcOperatingMarginByYear(annual: AnnualFinancial[]) {
  return [...annual]
    .sort((a, b) => a.fiscal_year - b.fiscal_year)
    .filter((row) => row.revenue !== 0)
    .map((row) => ({
      fiscal_year: row.fiscal_year,
      margin: (row.operating_income / row.revenue) * 100,
    }));
}

/** 높을수록 좋은 지표: good 이상이면 좋음, normal 이상이면 보통, 아니면 주의 */
const higherIsBetter = (value: number, good: number, normal: number): Status =>
  value >= good ? 'good' : value >= normal ? 'normal' : 'caution';

/** 낮을수록 좋은 지표 */
const lowerIsBetter = (value: number, good: number, normal: number): Status =>
  value <= good ? 'good' : value <= normal ? 'normal' : 'caution';

export function buildIndicators(financials: Financials): Indicator[] {
  const { annual, indicators } = financials;
  const result: Indicator[] = [];

  const growth = calcRevenueGrowth(annual);
  if (growth !== null) {
    result.push({
      id: 'revenue_growth',
      label: '매출 증가율',
      value: growth,
      display: `${round(growth)}%`,
      status: higherIsBetter(growth, 10, 0),
      is_sample: false,
      description:
        growth >= 0
          ? `작년보다 매출이 ${round(growth)}% 늘었어요.`
          : `작년보다 매출이 ${round(Math.abs(growth))}% 줄었어요.`,
      criteria: '10% 이상 늘면 좋음, 0~10%면 보통, 줄었으면 주의',
    });
  }

  const margin = calcOperatingMargin(annual);
  if (margin !== null) {
    result.push({
      id: 'operating_margin',
      label: '영업이익률',
      value: margin,
      display: `${round(margin)}%`,
      status: higherIsBetter(margin, 10, 5),
      is_sample: false,
      description: `100원어치 팔면 약 ${Math.round(margin)}원을 남겼어요.`,
      criteria: '10% 이상이면 좋음, 5~10%면 보통, 5% 미만이면 주의',
    });
  }

  result.push({
    id: 'roe',
    label: 'ROE',
    value: indicators.roe.value,
    display: `${indicators.roe.value}%`,
    status: higherIsBetter(indicators.roe.value, 10, 5),
    is_sample: indicators.roe.is_sample,
    description: `주주가 맡긴 돈 100원으로 1년에 약 ${Math.round(indicators.roe.value)}원을 벌었어요.`,
    criteria: '10% 이상이면 좋음, 5~10%면 보통, 5% 미만이면 주의',
  });

  result.push({
    id: 'debt_ratio',
    label: '부채비율',
    value: indicators.debt_ratio.value,
    display: `${indicators.debt_ratio.value}%`,
    status: lowerIsBetter(indicators.debt_ratio.value, 100, 200),
    is_sample: indicators.debt_ratio.is_sample,
    description: `회사 자기 돈 100원당 빚이 약 ${Math.round(indicators.debt_ratio.value)}원 있어요.`,
    criteria: '100% 이하면 좋음, 100~200%면 보통, 200%를 넘으면 주의',
  });

  result.push({
    id: 'per',
    label: 'PER',
    value: indicators.per.value,
    display: `${indicators.per.value}배`,
    status: lowerIsBetter(indicators.per.value, 15, 30),
    is_sample: indicators.per.is_sample,
    description: `지금 주가는 1년 이익의 약 ${Math.round(indicators.per.value)}배예요.`,
    criteria: '업종마다 달라요. 여기서는 15배 이하 좋음, 15~30배 보통, 30배 초과 주의로 봤어요',
  });

  return result;
}
