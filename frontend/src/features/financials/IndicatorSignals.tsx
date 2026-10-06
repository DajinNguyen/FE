import { SampleBadge } from '../../components/SampleBadge';
import { StatusBadge } from '../../components/StatusBadge';
import { TermText } from '../../components/TermText';
import type { Indicator } from './indicators';
import styles from './Financials.module.css';

/** 지표 신호등: 값 + 상태 배지 + 쉬운 설명 + 판단 기준 */
export function IndicatorSignals({ indicators }: { indicators: Indicator[] }) {
  return (
    <ul className={styles.signals}>
      {indicators.map((indicator) => (
        <li key={indicator.id} className={styles.signal} data-testid={`indicator-${indicator.id}`}>
          <div className={styles.signalHead}>
            <span className={styles.signalLabel}>
              <TermText text={indicator.label} />
            </span>
            <StatusBadge status={indicator.status} />
          </div>
          <p className={styles.signalValue}>
            {indicator.display} <SampleBadge isSample={indicator.is_sample} />
          </p>
          <p className={styles.signalDescription}>{indicator.description}</p>
          <p className={styles.signalCriteria}>기준: {indicator.criteria}</p>
        </li>
      ))}
    </ul>
  );
}
