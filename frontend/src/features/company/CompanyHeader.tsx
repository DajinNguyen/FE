import { CompanyAvatar } from '../../components/CompanyAvatar';
import { PriceChange } from '../../components/PriceChange';
import { SampleBadge } from '../../components/SampleBadge';
import { TermText } from '../../components/TermText';
import type { CompanyDetail } from '../../types';
import { formatPrice } from '../../utils/format';
import { WatchlistHeart } from '../watchlist/WatchlistHeart';
import { useIndicatorItems } from './useIndicatorItems';
import styles from './CompanyHeader.module.css';

const marketLabel = { KOSPI: '코스피', KOSDAQ: '코스닥' } as const;

/** 기업 헤더 + 작은 주가·주요 지표 줄. 주가는 보조 정보라 크게 보여주지 않아요. */
export function CompanyHeader({ company }: { company: CompanyDetail }) {
  const indicators = useIndicatorItems(company.stock_code);

  return (
    <section className={styles.header} aria-label="기업 정보">
      <div className={styles.identity}>
        <CompanyAvatar name={company.name} code={company.stock_code} size={52} />
        <div className={styles.titles}>
          <h1 className={styles.name}>
            {company.name}
            {company.market_alert && (
              <span className={styles.alert} title={company.market_alert}>
                주의
              </span>
            )}
          </h1>
          <p className={styles.meta}>
            {company.name_en} · {company.stock_code} · {marketLabel[company.market]} ·{' '}
            {company.sector}
          </p>
        </div>
        <WatchlistHeart stockCode={company.stock_code} companyName={company.name} />
      </div>
      {company.one_liner && <p className={styles.oneLiner}>{company.one_liner}</p>}

      <div className={styles.quote}>
        <span className={styles.price}>
          {formatPrice(company.current_price.value)}
          <PriceChange rate={company.change_rate.value} />
          <SampleBadge
            isSample={company.current_price.is_sample || company.change_rate.is_sample}
          />
        </span>
        {indicators.length > 0 && (
          <ul className={styles.chips} aria-label="주요 지표">
            {indicators.map((item) => (
              <li key={item.label} className={styles.chip}>
                <span className={styles.chipLabel}>
                  <TermText text={item.label} />
                </span>
                {item.display}
                <SampleBadge isSample={item.value.is_sample} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
