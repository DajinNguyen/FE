import type { AnnualFinancial } from '../../types';

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
