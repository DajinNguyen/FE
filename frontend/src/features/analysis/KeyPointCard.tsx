import { Fragment } from 'react';
import { ClampText } from '../../components/ClampText';
import { TermText } from '../../components/TermText';
import type { EvidenceKind, KeyPoint, KeyPointValue } from '../../types';
import { describeChange, evidenceChipText, keyPointLabel } from './reportMeta';
import styles from './AiAnalysis.module.css';

interface KeyPointCardProps {
  point: KeyPoint;
  index: number;
  onEvidence: (kind: EvidenceKind) => void;
}

const directionMark = { up: '▲', down: '▼', flat: '' } as const;
const directionLabel = { up: '증가', down: '감소', flat: '' } as const;

/**
 * 핵심 포인트 하나. 왼쪽은 번호, 오른쪽은 위에서부터
 * 분류 → 제목 → 숫자 한 줄(과거 → 현재) → 이유 → 의미 → 근거 순서예요.
 */
export function KeyPointCard({ point, index, onEvidence }: KeyPointCardProps) {
  const label = keyPointLabel[point.category] ?? '핵심 포인트';
  const { before, after } = point;
  const change = describeChange(before, after);
  // 과거·현재가 같은 지표면 이름을 한 번만 써요.
  const sharedLabel = before && after && before.label === after.label ? before.label : null;

  return (
    <li className={styles.point}>
      <span className={styles.pointIndex} aria-hidden="true">
        {index + 1}
      </span>
      <div className={styles.pointBody}>
        <p className={styles.pointCategory}>{label}</p>
        <h3 className={styles.pointTitle}>{point.title}</h3>

        {(before || after) && (
          <p className={styles.metric}>
            {sharedLabel && <span className={styles.metricLabel}>{sharedLabel}</span>}
            {before && <MetricValue value={before} showLabel={!sharedLabel} past />}
            {before && after && (
              <span className={styles.arrow} aria-hidden="true">
                →
              </span>
            )}
            {after && <MetricValue value={after} showLabel={!sharedLabel} />}
            {change && change.direction !== 'flat' && (
              <span className={`${styles.delta} ${styles[change.direction]}`}>
                <span aria-hidden="true">{directionMark[change.direction]}</span>
                <span className="visually-hidden">{directionLabel[change.direction]}</span>
                {change.text}
              </span>
            )}
          </p>
        )}

        <ClampText className={styles.explain}>
          <strong className={styles.lead}>왜 그런가요?</strong> <TermText text={point.reason} />
        </ClampText>
        <ClampText className={styles.explain}>
          <strong className={styles.lead}>무슨 뜻인가요?</strong> <TermText text={point.meaning} />
        </ClampText>

        {point.evidence.length > 0 && (
          <p className={styles.evidence}>
            <span className={styles.evidenceLabel}>근거</span>
            {point.evidence.map((ref, i) => (
              <Fragment key={`${ref.type}-${ref.label}-${ref.date}`}>
                {i > 0 && (
                  <span className={styles.evidenceSep} aria-hidden="true">
                    ·
                  </span>
                )}
                <button
                  type="button"
                  className={styles.evidenceLink}
                  onClick={() => onEvidence(ref.type)}
                >
                  {evidenceChipText(ref)}
                </button>
              </Fragment>
            ))}
          </p>
        )}
      </div>
    </li>
  );
}

function MetricValue({
  value,
  showLabel,
  past,
}: {
  value: KeyPointValue;
  showLabel: boolean;
  past?: boolean;
}) {
  return (
    <span className={past ? styles.before : styles.after}>
      {showLabel && <span className={styles.metricLabel}>{value.label}</span>}
      <strong>{value.value}</strong>
      <span className={styles.period}>({value.period})</span>
    </span>
  );
}
