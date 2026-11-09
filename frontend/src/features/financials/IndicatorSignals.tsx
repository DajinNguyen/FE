import { StatusBadge } from '../../components/StatusBadge';
import { TermText } from '../../components/TermText';
import type { Indicator } from './indicators';
import styles from './Financials.module.css';

/** 지표: 값 + 높은 편·보통·낮은 편 배지 + 쉬운 설명 + 비교 문장 + 판단 기준 */
export function IndicatorSignals({ indicators }: { indicators: Indicator[] }) {
  return (
    <ul className={styles.signals}>
      {indicators.map((indicator) => (
        <li key={indicator.id} className={styles.signal} data-testid={`indicator-${indicator.id}`}>
          <div className={styles.signalHead}>
            <span className={styles.signalLabel}>
              <TermText text={indicator.label} />
            </span>
            <StatusBadge status={indicator.status} label={indicator.levelLabel} />
          </div>
          <p className={styles.signalValue}>{indicator.display}</p>
          <p className={styles.signalDescription}>{indicator.description}</p>
          {indicator.comparison && (
            <p className={styles.signalComparison}>{indicator.comparison}</p>
          )}
          <p className={styles.signalCriteria}>기준: {indicator.criteria}</p>
        </li>
      ))}
    </ul>
  );
}
