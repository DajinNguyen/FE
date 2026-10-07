import { useId, useState } from 'react';
import { Icon } from '../../components/Icon';
import { TermText } from '../../components/TermText';
import type { EvidenceKind, KeyPoint } from '../../types';
import { evidenceLabel, keyPointLabel } from './reportMeta';
import styles from './AiAnalysis.module.css';

interface KeyPointCardProps {
  point: KeyPoint;
  index: number;
  onEvidence: (kind: EvidenceKind) => void;
}

/** 핵심 포인트 카드. 처음에는 제목과 과거→현재만, 누르면 이유·해석이 펼쳐져요. */
export function KeyPointCard({ point, index, onEvidence }: KeyPointCardProps) {
  const [open, setOpen] = useState(false);
  const bodyId = useId();
  const label = keyPointLabel[point.category] ?? '핵심 포인트';

  return (
    <li className={`${styles.point} ${open ? styles.pointOpen : ''}`}>
      <button
        type="button"
        className={styles.pointHead}
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.pointIndex} aria-hidden="true">
          {index + 1}
        </span>
        <span className={styles.pointMain}>
          <span className={styles.pointCategory}>{label}</span>
          <span className={styles.pointTitle}>{point.title}</span>
          {(point.before || point.after) && (
            <span className={styles.change}>
              {point.before && (
                <span>
                  {point.before.label} <strong>{point.before.value}</strong>
                  <span className={styles.period}>({point.before.period})</span>
                </span>
              )}
              {point.before && point.after && (
                <Icon name="arrowRight" size={14} className={styles.arrow} />
              )}
              {point.after && (
                <span>
                  {!point.before || point.before.label !== point.after.label
                    ? `${point.after.label} `
                    : ''}
                  <strong className={styles.afterValue}>{point.after.value}</strong>
                  <span className={styles.period}>({point.after.period})</span>
                </span>
              )}
            </span>
          )}
        </span>
        <Icon name="chevronDown" size={20} className={styles.chevron} />
      </button>

      <div id={bodyId} className={styles.pointBody} hidden={!open}>
        <dl className={styles.explain}>
          <div>
            <dt>왜 그런가요?</dt>
            <dd>
              <TermText text={point.reason} />
            </dd>
          </div>
          <div>
            <dt>무슨 뜻인가요?</dt>
            <dd>
              <TermText text={point.meaning} />
            </dd>
          </div>
        </dl>
        {point.evidence.length > 0 && (
          <div className={styles.evidenceRow}>
            <span className={styles.evidenceLabel}>근거</span>
            {point.evidence.map((kind) => (
              <button
                key={kind}
                type="button"
                className={styles.evidenceChip}
                onClick={() => onEvidence(kind)}
              >
                {evidenceLabel[kind] ?? kind}
              </button>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}
