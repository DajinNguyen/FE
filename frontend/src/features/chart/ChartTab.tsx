import { useState } from 'react';
import { Button } from '../../components/Button';
import { PriceChart } from '../../components/PriceChart';
import { PriceChange } from '../../components/PriceChange';
import { SampleBadge } from '../../components/SampleBadge';
import { Section } from '../../components/Section';
import { SegmentedControl } from '../../components/SegmentedControl';
import { useFinancials } from '../../hooks/useFinancials';
import { usePriceHistory } from '../../hooks/usePriceHistory';
import type { PricePeriod } from '../../types';
import { formatPrice } from '../../utils/format';
import type { GoToTab } from '../companyTabs';
import { AnnualFinancialsSection } from '../financials/AnnualFinancialsSection';
import styles from './ChartTab.module.css';

const periodOptions = [
  { value: '1m', label: '1달' },
  { value: '3m', label: '3달' },
  { value: '6m', label: '6달' },
  { value: '1y', label: '1년' },
] as const;

const periodLabel: Record<PricePeriod, string> = {
  '1m': '1달',
  '3m': '3달',
  '6m': '6달',
  '1y': '1년',
};

/** AI 분석 전에 보는 기본 화면: 주가 그래프 + 재무제표 그래프 (주요 지표는 오른쪽 사이드바) */
export function ChartTab({ stockCode, onGoToTab }: { stockCode: string; onGoToTab: GoToTab }) {
  const [period, setPeriod] = useState<PricePeriod>('3m');
  const { data: prices, isPending: isPricePending } = usePriceHistory(stockCode, period);
  const { data: financials } = useFinancials(stockCode);

  const points = prices?.points ?? [];
  const first = points[0]?.close;
  const last = points.at(-1)?.close;
  const high = points.length ? Math.max(...points.map((p) => p.close)) : undefined;
  const low = points.length ? Math.min(...points.map((p) => p.close)) : undefined;
  const periodRate = first && last ? ((last - first) / first) * 100 : undefined;

  return (
    <div>
      <Section
        title={
          <>
            주가 흐름 <SampleBadge isSample={Boolean(prices?.is_sample)} />
          </>
        }
      >
        {periodRate !== undefined && (
          <p className={styles.periodChange}>
            <span className={styles.periodLabel}>{periodLabel[period]} 전보다</span>
            <PriceChange rate={periodRate} size="md" />
          </p>
        )}
        <div className={styles.chartBox} aria-busy={isPricePending}>
          {points.length > 0 ? (
            <PriceChart points={points} height={300} />
          ) : (
            <div className={styles.chartPlaceholder} aria-hidden="true" />
          )}
        </div>
        <div className={styles.periodControl}>
          <SegmentedControl
            label="기간"
            options={periodOptions}
            value={period}
            onChange={setPeriod}
          />
        </div>
        {high !== undefined && low !== undefined && (
          <dl className={styles.highLow}>
            <div>
              <dt>기간 중 최고</dt>
              <dd className={styles.rise}>{formatPrice(high)}</dd>
            </div>
            <div>
              <dt>기간 중 최저</dt>
              <dd className={styles.fall}>{formatPrice(low)}</dd>
            </div>
          </dl>
        )}
        {prices?.is_sample && (
          <p className={styles.caption}>
            주가 그래프는 예시 데이터예요. 한국거래소 시세로 바꿀 예정이에요.
          </p>
        )}
      </Section>

      {financials && (
        <AnnualFinancialsSection financials={financials} title="재무제표 한눈에">
          <Button
            variant="secondary"
            className={styles.more}
            onClick={() => onGoToTab('financials')}
          >
            재무 분석 자세히 보기
          </Button>
        </AnnualFinancialsSection>
      )}
    </div>
  );
}
