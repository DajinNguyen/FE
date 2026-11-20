import { useCallback, useState } from 'react';
import { DataAsOf } from '../../components/DataAsOf';
import { ErrorState } from '../../components/ErrorState';
import { Icon } from '../../components/Icon';
import { PriceChange } from '../../components/PriceChange';
import { PriceChart } from '../../components/PriceChart';
import { SegmentedControl } from '../../components/SegmentedControl';
import { CANDLE_UNITS, type CandleUnit } from '../../config/priceChart';
import { usePriceHistory } from '../../hooks/usePriceHistory';
import { formatPrice } from '../../utils/format';
import { getPeriodRate } from '../../utils/trend';
import { PriceChartFullscreen } from './PriceChartFullscreen';
import styles from './PriceTrend.module.css';

/**
 * 개요 오른쪽 "주가 흐름": 현재가, 기간 등락률, 그래프, 캔들 단위(일·주·월·년) 버튼, 기준 시각.
 * 그래프 오른쪽 위 버튼으로 차트를 크게 볼 수 있어요 (거기서는 1일~전체 기간을 골라요).
 */
export function PriceTrend({ stockCode }: { stockCode: string }) {
  const [unit, setUnit] = useState<CandleUnit>('day');
  const [fullscreen, setFullscreen] = useState(false);
  const option = CANDLE_UNITS.find((o) => o.value === unit)!;
  const { data, isPending, isError, error, refetch } = usePriceHistory(
    stockCode,
    option.period,
    unit,
  );
  const closeFullscreen = useCallback(() => setFullscreen(false), []);

  const points = data?.points ?? [];
  const last = points.at(-1);
  const periodRate = getPeriodRate(points);

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
              {option.since} <PriceChange rate={periodRate} size="md" />
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
        {points.length > 0 && (
          <PriceChart
            points={points}
            height={220}
            interval={data?.interval ?? unit}
            action={
              <button
                type="button"
                className={styles.expand}
                onClick={() => setFullscreen(true)}
                aria-label="차트 크게 보기"
                title="차트 크게 보기"
              >
                <Icon name="expand" size={16} />
              </button>
            }
          />
        )}
      </div>

      <div className={styles.units}>
        <SegmentedControl
          label="캔들 단위"
          options={CANDLE_UNITS}
          value={unit}
          onChange={setUnit}
        />
      </div>
      {/* 주·월·년 캔들의 날짜는 그 기간의 첫날이라, 기준일은 일 캔들에서만 보여 줘요 */}
      {last && unit === 'day' && (
        <DataAsOf value={last.date} prefix="종가" className={styles.asOf} />
      )}

      {fullscreen && <PriceChartFullscreen stockCode={stockCode} onClose={closeFullscreen} />}
    </section>
  );
}
