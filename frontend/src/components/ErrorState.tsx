import { errorReason } from '../api/errors';
import { Button } from './Button';
import styles from './ErrorState.module.css';

/**
 * 불러오기 실패 안내: 무엇을 못 불러왔는지 + 원인 + [다시 시도].
 * 한 영역이 실패해도 그 영역 안에서만 보여줘요.
 */
export function ErrorState({
  title,
  error,
  onRetry,
  compact,
}: {
  /** 예: "산업 정보를 불러오지 못했어요". 바깥에 제목이 이미 있으면 비워도 돼요. */
  title?: string;
  error?: unknown;
  onRetry?: () => void;
  /** 작은 영역용 (여백 줄이기) */
  compact?: boolean;
}) {
  return (
    <div className={`${styles.error} ${compact ? styles.compact : ''}`} role="alert">
      {title && <p className={styles.title}>{title}</p>}
      <p className={styles.reason}>{errorReason(error)}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} className={styles.retry}>
          다시 시도
        </Button>
      )}
    </div>
  );
}
