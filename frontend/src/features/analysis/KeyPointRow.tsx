import { Icon } from '../../components/Icon';
import type { KeyPoint } from '../../types';
import { describeChange } from './reportMeta';
import styles from './AiAnalysis.module.css';

interface KeyPointRowProps {
  point: KeyPoint;
  onOpen: (point: KeyPoint) => void;
}

const directionMark = { up: '▲', down: '▼', flat: '' } as const;
const directionLabel = { up: '증가', down: '감소', flat: '' } as const;

/**
 * 핵심 포인트 한 줄: 결론 문장과 핵심 숫자만 보여주고,
 * 누르면 상세 시트(숫자 변화·이유·연도별 막대·근거)가 열려요.
 */
export function KeyPointRow({ point, onOpen }: KeyPointRowProps) {
  const change = describeChange(point.before, point.after);
  const keyValue = point.after;

  return (
    <li className={styles.point}>
      <button
        type="button"
        className={styles.pointHead}
        aria-haspopup="dialog"
        onClick={() => onOpen(point)}
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
        <Icon name="chevronRight" size={18} className={styles.chevron} />
      </button>
    </li>
  );
}
