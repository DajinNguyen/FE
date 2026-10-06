import { formatSignedPercent } from '../utils/format';
import styles from './PriceChange.module.css';

export function PriceChange({ rate, size = 'sm' }: { rate: number; size?: 'sm' | 'md' }) {
  const direction = rate > 0 ? 'rise' : rate < 0 ? 'fall' : 'flat';
  const arrow = rate > 0 ? '▲' : rate < 0 ? '▼' : '';
  return (
    <span className={`${styles.change} ${styles[direction]} ${styles[size]}`}>
      <span aria-hidden="true">{arrow}</span>
      <span className="visually-hidden">{rate > 0 ? '상승' : rate < 0 ? '하락' : '보합'}</span>
      {formatSignedPercent(rate)}
    </span>
  );
}
