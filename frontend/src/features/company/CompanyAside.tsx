import { useState } from 'react';
import { PriceChart } from '../../components/PriceChart';
import { PriceChange } from '../../components/PriceChange';
import { SampleBadge } from '../../components/SampleBadge';
import { SegmentedControl } from '../../components/SegmentedControl';
import { TermText } from '../../components/TermText';
import { usePriceHistory } from '../../hooks/usePriceHistory';
import type { PricePeriod } from '../../types';
import { formatPrice } from '../../utils/format';
import { useIndicatorItems } from './useIndicatorItems';
import styles from './CompanyAside.module.css';

const periodOptions = [
  { value: '1m', label: '1달' },
  { value: '3m', label: '3달' },
  { value: '6m', label: '6달' },
  { value: '1y', label: '1년' },
] as const;

/** 오른쪽 열(PC에서는 스크롤해도 따라와요): 주가 미니 차트 + 주요 지표 */
export function CompanyAside({ stockCode }: { stockCode: string }) {
  const [period, setPeriod] = useState<PricePeriod>('3m');
  const { data: prices } = usePriceHistory(stockCode, period);
  const indicators = useIndicatorItems(stockCode, { withDebt: true });

  const points = prices?.points ?? [];
  const first = points[0]?.close;
  const last = points.at(-1)?.close;
  const periodRate = first && last ? ((last - first) / first) * 100 : undefined;
  const periodLabel = periodOptions.find((o) => o.value === period)?.label;

  return (
    <aside className={styles.aside} aria-label="주가와 주요 지표">
      <section className={styles.card}>
        <div className={styles.cardHead}>
          <h2 className={styles.cardTitle}>
            주가 흐름 <SampleBadge isSample={Boolean(prices?.is_sample)} />
          </h2>
          {periodRate !== undefined && (
            <span className={styles.periodChange}>
              {periodLabel} 전보다 <PriceChange rate={periodRate} />
            </span>
          )}
        </div>
        <div className={styles.chartBox}>
          {points.length > 0 ? (
            <PriceChart points={points} height={120} />
          ) : (
            <div className={styles.chartPlaceholder} aria-hidden="true" />
          )}
        </div>
        <SegmentedControl
          label="기간"
          options={periodOptions}
          value={period}
          onChange={setPeriod}
        />
        {last !== undefined && (
          <p className={styles.small}>
            최근 종가 {formatPrice(last)}
            {prices?.is_sample && ' · 예시 데이터예요'}
          </p>
        )}
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>주요 지표</h2>
        {indicators.length > 0 ? (
          <dl className={styles.stats}>
            {indicators.map((item) => (
              <div key={item.label} className={styles.stat}>
                <dt>
                  <TermText text={item.label} />
                </dt>
                <dd>
                  {item.display} <SampleBadge isSample={item.value.is_sample} />
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className={styles.small}>자료를 찾지 못했어요</p>
        )}
      </section>

      <p className={styles.note}>
        교육용 정보이며 투자 추천이 아니에요. 숫자는 공식 자료를 그대로 쓰고, AI는 설명만 써요.
      </p>
    </aside>
  );
}
