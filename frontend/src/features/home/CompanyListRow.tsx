import { PriceChange } from '../../components/PriceChange';
import { SampleBadge } from '../../components/SampleBadge';
import type { CompanySummary, TradingCompany } from '../../types';
import { formatTradingValue } from '../../utils/format';
import styles from './CompanyList.module.css';

interface CompanyListRowProps {
  company: CompanySummary | TradingCompany;
  onSelect: (company: CompanySummary) => void;
  rank?: number;
}

const isTrading = (company: CompanySummary | TradingCompany): company is TradingCompany =>
  'trading_value' in company;

/**
 * 기업 목록의 한 줄: 순위 · 기업명 · 한 줄 소개 · AI 한 줄 결론 · 거래대금 · 등락률(작게).
 * 메인 거래대금 순위, 전체 순위 화면, 업종 탭에서 같이 써요.
 */
export function CompanyListRow({ company, onSelect, rank }: CompanyListRowProps) {
  const trading = isTrading(company) ? company : null;
  const isSample = company.change_rate.is_sample || Boolean(trading?.trading_value.is_sample);

  return (
    <li className={styles.item}>
      <button type="button" className={styles.row} onClick={() => onSelect(company)}>
        {rank !== undefined && <span className={styles.rank}>{rank}</span>}
        <span className={styles.main}>
          <span className={styles.nameLine}>
            <span className={styles.name}>{company.name}</span>
            {company.market_alert && (
              <span className={styles.alert} title={company.market_alert}>
                주의
              </span>
            )}
          </span>
          <span className={styles.oneLiner}>{company.one_liner}</span>
          {trading?.ai_headline && (
            <span className={styles.ai}>
              <span className={styles.aiLabel}>AI 결론</span>
              {trading.ai_headline}
            </span>
          )}
        </span>
        <span className={styles.side}>
          {trading && (
            <span className={styles.tradingValue}>
              거래대금 <strong>{formatTradingValue(trading.trading_value.value)}</strong>
            </span>
          )}
          <span className={styles.rate}>
            <PriceChange rate={company.change_rate.value} />
            <SampleBadge isSample={isSample} />
          </span>
        </span>
      </button>
    </li>
  );
}
