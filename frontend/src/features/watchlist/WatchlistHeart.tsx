import { Icon } from '../../components/Icon';
import { useToast } from '../../hooks/useToast';
import { useWatchlist } from '../../hooks/useWatchlist';
import styles from './WatchlistHeart.module.css';

export function WatchlistHeart({
  stockCode,
  companyName,
}: {
  stockCode: string;
  companyName: string;
}) {
  const { isWatched, toggle } = useWatchlist();
  const { showToast } = useToast();
  const watched = isWatched(stockCode);

  const handleClick = () => {
    const added = toggle(stockCode);
    showToast(added ? `${companyName}을(를) 관심 기업에 담았어요` : '관심 기업에서 뺐어요');
  };

  return (
    <button
      type="button"
      className={`${styles.heart} ${watched ? styles.on : ''}`}
      onClick={handleClick}
      aria-pressed={watched}
      aria-label={watched ? '관심 기업에서 빼기' : '관심 기업에 담기'}
    >
      <Icon name="heart" filled={watched} />
    </button>
  );
}
