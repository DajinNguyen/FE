import { Button } from '../../components/Button';
import { ErrorState } from '../../components/ErrorState';
import type { NewsItem } from '../../types';
import { NewsListItem } from './NewsListItem';
import styles from './News.module.css';

interface NewsListProps {
  items: NewsItem[];
  isPending?: boolean;
  isError?: boolean;
  /** 실패 원인 */
  error?: unknown;
  /** [다시 시도] */
  onRetry?: () => void;
  /** 뉴스가 없을 때 안내 */
  emptyText?: string;
  compact?: boolean;
  /** [더 보기] (다음 페이지가 있을 때만) */
  hasMore?: boolean;
  onMore?: () => void;
  isLoadingMore?: boolean;
  label?: string;
}

/** 뉴스 목록: 불러오는 중이면 빈 자리, 없으면 안내, 다음 페이지가 있으면 [더 보기] */
export function NewsList({
  items,
  isPending = false,
  isError = false,
  error,
  onRetry,
  emptyText = '아직 관련 뉴스가 없어요',
  compact = false,
  hasMore = false,
  onMore,
  isLoadingMore = false,
  label = '뉴스',
}: NewsListProps) {
  if (isPending) {
    return (
      <div className={styles.skeleton} aria-label="뉴스를 불러오고 있어요" role="status">
        {[0, 1, 2].map((i) => (
          <div key={i} className={styles.skeletonRow}>
            <div className={`${styles.skeletonLine} ${styles.skeletonTitle}`} />
            <div className={`${styles.skeletonLine} ${styles.skeletonMeta}`} />
          </div>
        ))}
      </div>
    );
  }
  if (isError)
    return <ErrorState compact title="뉴스를 불러오지 못했어요" error={error} onRetry={onRetry} />;
  if (items.length === 0) return <p className={styles.empty}>{emptyText}</p>;

  return (
    <div>
      <ul className={`${styles.list} ${compact ? styles.compactList : ''}`} aria-label={label}>
        {items.map((item) => (
          <li key={item.id}>
            <NewsListItem item={item} compact={compact} />
          </li>
        ))}
      </ul>
      {hasMore && onMore && (
        <Button
          variant="secondary"
          className={styles.more}
          onClick={onMore}
          disabled={isLoadingMore}
        >
          {isLoadingMore ? '불러오는 중…' : '더 보기'}
        </Button>
      )}
    </div>
  );
}
