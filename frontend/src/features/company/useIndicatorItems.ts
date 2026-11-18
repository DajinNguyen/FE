import { useCompany } from '../../hooks/useCompanies';
import { useFinancials } from '../../hooks/useFinancials';
import type { SampleNumber } from '../../types';
import { formatTrillion } from '../../utils/format';

export interface IndicatorItem {
  label: string;
  value: SampleNumber;
  display: string;
}

/** 시가총액·PER·PBR·ROE(·부채비율)과 지표 기준. 자료가 없는 항목은 빼요. */
export function useIndicatorItems(stockCode: string, { withDebt = false } = {}) {
  const { data: company } = useCompany(stockCode);
  const { data: financials } = useFinancials(stockCode);

  const items: IndicatorItem[] = [];
  if (company?.market_cap) {
    items.push({
      label: '시가총액',
      value: company.market_cap,
      display: formatTrillion(company.market_cap.value, { min: 0, max: 0 }),
    });
  }
  if (financials) {
    const { per, pbr, roe, debt_ratio } = financials.indicators;
    // 적자(PER)·자본잠식(ROE) 등으로 백엔드가 null 을 보내면 그 항목만 빼요
    const add = (label: string, value: SampleNumber | null | undefined, suffix: string) => {
      if (value) items.push({ label, value, display: `${value.value}${suffix}` });
    };
    add('PER', per, '배');
    add('PBR', pbr, '배');
    add('ROE', roe, '%');
    if (withDebt) add('부채비율', debt_ratio, '%');
  }
  return { items, asOf: financials?.indicators_as_of ?? null };
}
