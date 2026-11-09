import type { AnnualFinancial, Financials, IndicatorBenchmark, Status } from '../../types';

export type IndicatorId = 'revenue_growth' | 'operating_margin' | 'roe' | 'debt_ratio' | 'per';

/** 값이 어느 쪽인지: 높은 편 / 보통 / 낮은 편 */
export type IndicatorLevel = 'high' | 'normal' | 'low';

export interface Indicator {
  id: IndicatorId;
  label: string;
  value: number;
  display: string;
  /** 색(좋은 쪽·보통·주의). 평가하지 않는 지표는 null */
  status: Status | null;
  /** 배지 글자: "높은 편", "낮은 편 · 안정적", "평가 제외" */
  levelLabel: string;
  /** 쉬운 설명 한 줄 (값에 따라 문장이 바뀌어요) */
  description: string;
  /** 비교 문장. 예: "반도체 업종 중앙값 7.5%보다 높은 편이에요" */
  comparison: string | null;
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

const levelText: Record<IndicatorLevel, string> = {
  high: '높은 편',
  normal: '보통',
  low: '낮은 편',
};

/** 기본 기준: high 이상이면 높은 편, low 미만이면 낮은 편 */
const levelByThreshold = (value: number, high: number, low: number): IndicatorLevel =>
  value >= high ? 'high' : value < low ? 'low' : 'normal';

/** 비교 기준값보다 10% 넘게 크면 높은 편, 10% 넘게 작으면 낮은 편 */
const levelByBenchmark = (value: number, basis: number): IndicatorLevel => {
  const gap = Math.abs(basis) * 0.1;
  return value > basis + gap ? 'high' : value < basis - gap ? 'low' : 'normal';
};

/** 높을수록 좋은 지표인지에 따라 색을 정해요. */
const statusOf = (level: IndicatorLevel, higherIsBetter: boolean): Status =>
  level === 'normal' ? 'normal' : (level === 'high') === higherIsBetter ? 'good' : 'caution';

interface Rule {
  id: IndicatorId;
  label: string;
  value: number;
  unit: '%' | '배';
  higherIsBetter: boolean;
  /** 기본 기준 [높은 편 기준, 낮은 편 기준] */
  thresholds: [number, number];
  description: string;
  criteria: string;
}

function evaluate(rule: Rule, benchmark: IndicatorBenchmark | undefined): Indicator {
  const basis = benchmark?.basis_value ?? null;
  const level =
    basis !== null
      ? levelByBenchmark(rule.value, basis)
      : levelByThreshold(rule.value, ...rule.thresholds);
  const format = (v: number) => `${round(v)}${rule.unit}`;
  const comparison =
    benchmark && basis !== null
      ? level === 'normal'
        ? `${benchmark.basis_label} ${format(basis)}와 비슷해요`
        : `${benchmark.basis_label} ${format(basis)}보다 ${levelText[level]}이에요`
      : null;
  const stable = rule.id === 'debt_ratio' && level === 'low' ? ' · 안정적' : '';
  return {
    id: rule.id,
    label: rule.label,
    value: rule.value,
    display: format(rule.value),
    status: statusOf(level, rule.higherIsBetter),
    levelLabel: `${levelText[level]}${stable}`,
    description: rule.description,
    comparison,
    criteria: rule.criteria,
  };
}

/** 평가하지 않는 지표 (금융업 부채비율, 적자 PER, 자본잠식 ROE·부채비율) */
const excluded = (base: Indicator, reason: string, display = base.display): Indicator => ({
  ...base,
  display,
  status: null,
  levelLabel: '평가 제외',
  comparison: null,
  description: reason,
});

export function buildIndicators(financials: Financials): Indicator[] {
  const { annual, indicators, benchmarks = {}, flags } = financials;
  const result: Indicator[] = [];

  const growth = calcRevenueGrowth(annual);
  if (growth !== null) {
    result.push(
      evaluate(
        {
          id: 'revenue_growth',
          label: '매출 증가율',
          value: growth,
          unit: '%',
          higherIsBetter: true,
          thresholds: [10, 0],
          description:
            growth >= 0
              ? `작년보다 매출이 ${round(growth)}% 늘었어요.`
              : `작년보다 매출이 ${round(Math.abs(growth))}% 줄었어요.`,
          criteria: '10% 이상 늘면 높은 편, 줄었으면 낮은 편',
        },
        benchmarks.revenue_growth,
      ),
    );
  }

  const margin = calcOperatingMargin(annual);
  if (margin !== null) {
    result.push(
      evaluate(
        {
          id: 'operating_margin',
          label: '영업이익률',
          value: margin,
          unit: '%',
          higherIsBetter: true,
          thresholds: [10, 5],
          description: `100원어치 팔면 약 ${Math.round(margin)}원을 남겼어요.`,
          criteria: '10% 이상이면 높은 편, 5% 미만이면 낮은 편',
        },
        benchmarks.operating_margin,
      ),
    );
  }

  const roe = evaluate(
    {
      id: 'roe',
      label: 'ROE',
      value: indicators.roe.value,
      unit: '%',
      higherIsBetter: true,
      thresholds: [10, 5],
      description: `주주가 맡긴 돈 100원으로 1년에 약 ${Math.round(indicators.roe.value)}원을 벌었어요.`,
      criteria: '10% 이상이면 높은 편, 5% 미만이면 낮은 편',
    },
    benchmarks.roe,
  );
  result.push(
    flags?.is_capital_impaired
      ? excluded(roe, '자본잠식(쌓아둔 자기 돈이 줄어든 상태)이라 ROE로 평가하지 않아요.')
      : roe,
  );

  const debt = evaluate(
    {
      id: 'debt_ratio',
      label: '부채비율',
      value: indicators.debt_ratio.value,
      unit: '%',
      higherIsBetter: false,
      thresholds: [200, 100],
      description: `회사 자기 돈 100원당 빚이 약 ${Math.round(indicators.debt_ratio.value)}원 있어요.`,
      criteria: '100% 아래면 낮은 편(안정적), 200%를 넘으면 높은 편',
    },
    benchmarks.debt_ratio,
  );
  result.push(
    flags?.is_financial
      ? excluded(debt, '금융회사는 고객 돈을 맡아 부채가 많아 보여서 부채비율로 평가하지 않아요.')
      : flags?.is_capital_impaired
        ? excluded(debt, '자본잠식(쌓아둔 자기 돈이 줄어든 상태)이라 부채비율로 평가하지 않아요.')
        : debt,
  );

  const per = evaluate(
    {
      id: 'per',
      label: 'PER',
      value: indicators.per.value,
      unit: '배',
      higherIsBetter: false,
      thresholds: [30, 15],
      description: `지금 주가는 1년 이익의 약 ${Math.round(indicators.per.value)}배예요.`,
      criteria: '업종마다 달라요. 여기서는 15배 아래면 낮은 편, 30배를 넘으면 높은 편으로 봤어요',
    },
    benchmarks.per,
  );
  result.push(
    flags?.is_loss
      ? excluded(per, '적자(손실)라서 PER을 계산할 수 없어요.', '계산할 수 없어요')
      : per,
  );

  return result;
}
