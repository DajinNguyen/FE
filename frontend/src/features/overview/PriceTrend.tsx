import { useState } from 'react';
import { DataAsOf } from '../../components/DataAsOf';
import { ErrorState } from '../../components/ErrorState';
import { PriceChange } from '../../components/PriceChange';
import { PriceChart } from '../../components/PriceChart';
import { SegmentedControl } from '../../components/SegmentedControl';
import { usePriceHistory } from '../../hooks/usePriceHistory';
import type { PricePeriod } from '../../types';
import { formatPrice } from '../../utils/format';
import { getPeriodRate } from '../../utils/trend';
import styles from './PriceTrend.module.css';

const periodOptions = [
  { value: '1m', label: '1달' },
  { value: '3m', label: '3달' },
  { value: '6m', label: '6달' },
  { value: '1y', label: '1년' },
] as const;

/** 개요 오른쪽 "주가 흐름": 현재가, 기간 등락률, 그래프, 기간 버튼, 기준 시각 */
export function PriceTrend({ stockCode }: { stockCode: string }) {
  const [period, setPeriod] = useState<PricePeriod>('3m');
  const { data, isPending, isError, error, refetch } = usePriceHistory(stockCode, period);

  const points = data?.points ?? [];
  const last = points.at(-1);
  const periodRate = getPeriodRate(points);
  const periodLabel = periodOptions.find((o) => o.value === period)?.label;

  return (
    <section className={styles.card} aria-labelledby="price-trend-title">
      <h2 id="price-trend-title" className={styles.title}>
        주가 흐름
      </h2>

      {last && (
        <div className={styles.summary}>
          <p className={styles.price}>{formatPrice(last.close)}</p>
          {periodRate !== undefined && (
            <p className={styles.periodChange}>
              {periodLabel} 전보다 <PriceChange rate={periodRate} size="md" />
            </p>
          )}
        </div>
      )}

      <div className={styles.chartBox}>
        {isPending && <div className={styles.placeholder} aria-hidden="true" />}
        {isError && !data && (
          <ErrorState
            compact
            title="주가를 불러오지 못했어요"
            error={error}
            onRetry={() => refetch()}
          />
        )}
        {data && points.length === 0 && <p className={styles.empty}>주가 자료가 아직 없어요.</p>}
        {points.length > 0 && <PriceChart points={points} height={160} />}
      </div>

      <SegmentedControl label="기간" options={periodOptions} value={period} onChange={setPeriod} />
      {last && <DataAsOf value={last.date} prefix="종가" className={styles.asOf} />}
    </section>
  );
}
