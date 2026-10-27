import type { Status } from '../types';
import styles from './StatusBadge.module.css';

/** 지표 배지: 글자는 "높은 편·보통·낮은 편", 색은 좋은 쪽·보통·주의 (평가 제외는 회색) */
export function StatusBadge({ status, label }: { status: Status | null; label: string }) {
  return (
    <span className={`${styles.badge} ${status ? styles[status] : styles.none}`}>
      <span className={styles.dot} aria-hidden="true" />
      {label}
    </span>
  );
}
