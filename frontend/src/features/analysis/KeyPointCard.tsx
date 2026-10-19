import { ClampText } from '../../components/ClampText';
import { TermText } from '../../components/TermText';
import type { EvidenceKind, KeyPoint } from '../../types';
import { describeChange, evidenceChipText, keyPointLabel } from './reportMeta';
import styles from './AiAnalysis.module.css';

interface KeyPointCardProps {
  point: KeyPoint;
  index: number;
  onEvidence: (kind: EvidenceKind) => void;
}

const directionMark = { up: '▲', down: '▼', flat: '' } as const;
const directionLabel = { up: '증가', down: '감소', flat: '' } as const;

/** 핵심 포인트 하나. 제목 → 과거·현재 숫자 → 이유·의미 → 근거 칩 순서로 모두 펼쳐서 보여줘요. */
export function KeyPointCard({ point, index, onEvidence }: KeyPointCardProps) {
  const label = keyPointLabel[point.category] ?? '핵심 포인트';
  const change = describeChange(point.before, point.after);
  const sameLabel = point.before && point.after && point.before.label === point.after.label;

  return (
    <li className={styles.point}>
      <p className={styles.pointCategory}>
        <span className={styles.pointIndex}>{index + 1}</span> {label}
      </p>
      <h3 className={styles.pointTitle}>{point.title}</h3>

      {(point.before || point.after) && (
        <div className={styles.change}>
          {sameLabel && <p className={styles.changeLabel}>{point.after?.label}</p>}
          <div className={styles.values}>
            {point.before && (
              <span className={styles.before}>
                {!sameLabel && <span className={styles.valueLabel}>{point.before.label}</span>}
                <strong>{point.before.value}</strong>
                <span className={styles.period}>{point.before.period}</span>
              </span>
            )}
            {point.before && point.after && (
              <span className={styles.arrow} aria-hidden="true">
                →
              </span>
            )}
            {point.after && (
              <span className={styles.after}>
                {!sameLabel && <span className={styles.valueLabel}>{point.after.label}</span>}
                <strong>{point.after.value}</strong>
                <span className={styles.period}>{point.after.period}</span>
              </span>
            )}
            {change && change.direction !== 'flat' && (
              <span className={`${styles.delta} ${styles[change.direction]}`}>
                <span aria-hidden="true">{directionMark[change.direction]}</span>
                <span className="visually-hidden">{directionLabel[change.direction]}</span>
                {change.text}
              </span>
            )}
          </div>
        </div>
      )}

      <dl className={styles.explain}>
        <div>
          <dt>왜 그런가요?</dt>
          <dd>
            <ClampText>
              <TermText text={point.reason} />
            </ClampText>
          </dd>
        </div>
        <div>
          <dt>무슨 뜻인가요?</dt>
          <dd>
            <ClampText>
              <TermText text={point.meaning} />
            </ClampText>
          </dd>
        </div>
      </dl>

      {point.evidence.length > 0 && (
        <div className={styles.evidenceRow}>
          <span className={styles.evidenceLabel}>근거</span>
          {point.evidence.map((ref) => (
            <button
              key={`${ref.type}-${ref.label}-${ref.date}`}
              type="button"
              className={styles.evidenceChip}
              onClick={() => onEvidence(ref.type)}
            >
              {evidenceChipText(ref)}
            </button>
          ))}
        </div>
      )}
    </li>
  );
}
