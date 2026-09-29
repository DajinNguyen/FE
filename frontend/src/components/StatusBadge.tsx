import type { Status } from '../types';
import styles from './StatusBadge.module.css';

const statusLabel: Record<Status, string> = {
  good: '좋음',
  normal: '보통',
  caution: '주의',
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`${styles.badge} ${styles[status]}`}>
      <span className={styles.dot} aria-hidden="true" />
      {statusLabel[status]}
    </span>
  );
}
