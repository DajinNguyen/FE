import { useCompany } from '../../hooks/useCompanies';
import { useFinancials } from '../../hooks/useFinancials';
import type { SampleNumber } from '../../types';
import { formatTrillion } from '../../utils/format';

export interface IndicatorItem {
  label: string;
  value: SampleNumber;
  display: string;
}

/** 시가총액·PER·PBR·ROE(·부채비율). 자료가 없는 항목은 빼요. */
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
    items.push(
      { label: 'PER', value: per, display: `${per.value}배` },
      { label: 'PBR', value: pbr, display: `${pbr.value}배` },
      { label: 'ROE', value: roe, display: `${roe.value}%` },
    );
    if (withDebt)
      items.push({ label: '부채비율', value: debt_ratio, display: `${debt_ratio.value}%` });
  }
  return items;
}
