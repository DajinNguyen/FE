import type { MarketIndex } from '../../types';
import styles from './Market.module.css';

const indexName = { KOSPI: '코스피', KOSDAQ: '코스닥' } as const;

const formatNumber = (value: number) =>
  value.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "▲1.18%" — 상승 빨강, 하락 파랑, 화살표와 글자로도 알려줘요. */
export function IndexChange({ index }: { index: MarketIndex }) {
  const direction = index.change > 0 ? 'rise' : index.change < 0 ? 'fall' : 'flat';
  const arrow = { rise: '▲', fall: '▼', flat: '' }[direction];
  const word = { rise: '상승', fall: '하락', flat: '보합' }[direction];
  return (
    <span
      className={`${styles.change} ${styles[direction]}`}
      data-direction={direction}
      title={`어제보다 ${formatNumber(Math.abs(index.change))} ${word}`}
    >
      <span aria-hidden="true">{arrow}</span>
      <span className="visually-hidden">어제보다 {word}</span>
      {Math.abs(index.change_rate).toFixed(2)}%
    </span>
  );
}

/** 코스피·코스닥: 시장 한마디 오른쪽에 세로로 쌓은 작은 칩 2개 */
export function MarketIndexes({ indexes }: { indexes: MarketIndex[] }) {
  const sorted = [...indexes].sort(
    (a, b) => Number(b.code === 'KOSPI') - Number(a.code === 'KOSPI'),
  );
  return (
    <ul className={styles.indexChips} aria-label="시장 지수">
      {sorted.map((index) => (
        <li key={index.code} className={styles.indexChip}>
          <span className={styles.indexName}>{indexName[index.code]}</span>
          <strong className={styles.indexValue}>{formatNumber(index.value)}</strong>
          <IndexChange index={index} />
        </li>
      ))}
    </ul>
  );
}
