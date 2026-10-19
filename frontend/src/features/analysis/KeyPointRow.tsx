import { Fragment, useId, useState } from 'react';
import { Icon } from '../../components/Icon';
import { TermText } from '../../components/TermText';
import type { EvidenceKind, KeyPoint } from '../../types';
import { describeChange, evidenceChipText } from './reportMeta';
import styles from './AiAnalysis.module.css';

interface KeyPointRowProps {
  point: KeyPoint;
  onEvidence: (kind: EvidenceKind) => void;
}

const directionMark = { up: '▲', down: '▼', flat: '' } as const;
const directionLabel = { up: '증가', down: '감소', flat: '' } as const;

/**
 * 핵심 포인트 한 줄: 결론 문장과 핵심 숫자만 보여주고,
 * 누르면 과거 → 현재 숫자, 이유, 의미, 근거가 펼쳐져요.
 */
export function KeyPointRow({ point, onEvidence }: KeyPointRowProps) {
  const [open, setOpen] = useState(false);
  const bodyId = useId();
  const { before, after } = point;
  const change = describeChange(before, after);
  // 한 줄에는 현재 값만 보여줘요. (과거 값만 있으면 펼친 내용에서 보여줘요)
  const keyValue = after;

  return (
    <li className={styles.point}>
      <button
        type="button"
        className={styles.pointHead}
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.pointTitle}>{point.title}</span>
        {keyValue && (
          <span className={styles.keyValue}>
            {keyValue.value}
            {change && change.direction !== 'flat' && (
              <span className={`${styles.delta} ${styles[change.direction]}`}>
                <span aria-hidden="true">{directionMark[change.direction]}</span>
                <span className="visually-hidden">{directionLabel[change.direction]}</span>
                {change.text}
              </span>
            )}
          </span>
        )}
        <Icon name="chevronDown" size={18} className={styles.chevron} />
      </button>

      <div id={bodyId} className={styles.pointBody} hidden={!open}>
        {(before || after) && (
          <p className={styles.metric}>
            {before && (
              <span>
                {before.label} {before.value}
                <span className={styles.period}> ({before.period})</span>
              </span>
            )}
            {before && after && <span aria-hidden="true"> → </span>}
            {after && (
              <span>
                {!before || before.label !== after.label ? `${after.label} ` : ''}
                <strong>{after.value}</strong>
                <span className={styles.period}> ({after.period})</span>
              </span>
            )}
          </p>
        )}
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
          <p className={styles.evidence}>
            <span className={styles.evidenceLabel}>근거</span>
            {point.evidence.map((ref, i) => (
              <Fragment key={`${ref.type}-${ref.label}-${ref.date}`}>
                {i > 0 && <span aria-hidden="true">·</span>}
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
