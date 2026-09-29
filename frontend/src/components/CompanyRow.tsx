import type { CompanySummary } from '../types';
import { formatPrice } from '../utils/format';
import { CompanyAvatar } from './CompanyAvatar';
import { PriceChange } from './PriceChange';
import { SampleBadge } from './SampleBadge';
import styles from './CompanyRow.module.css';

interface CompanyRowProps {
  company: CompanySummary;
  onSelect: (company: CompanySummary) => void;
  rank?: number;
}

export function CompanyRow({ company, onSelect, rank }: CompanyRowProps) {
  const isSample = company.current_price.is_sample || company.change_rate.is_sample;
  return (
    <li>
      <button type="button" className={styles.row} onClick={() => onSelect(company)}>
        {rank !== undefined && <span className={styles.rank}>{rank}</span>}
        <CompanyAvatar name={company.name} code={company.stock_code} />
        <span className={styles.info}>
          <span className={styles.name}>{company.name}</span>
          <span className={styles.meta}>
            {company.name_en} · {company.stock_code} · {company.sector}
          </span>
        </span>
        <span className={styles.price}>
          <span className={styles.priceValue}>{formatPrice(company.current_price.value)}</span>
          <span className={styles.priceSub}>
            <PriceChange rate={company.change_rate.value} />
            <SampleBadge isSample={isSample} />
          </span>
        </span>
      </button>
    </li>
  );
}
