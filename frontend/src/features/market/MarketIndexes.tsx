import { SampleBadge } from '../../components/SampleBadge';
import type { MarketIndex } from '../../types';
import { Sparkline } from './Sparkline';
import styles from './Market.module.css';

const indexName = { KOSPI: '코스피', KOSDAQ: '코스닥' } as const;

const formatNumber = (value: number) =>
  value.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "▲ 31.20 (+1.18%)" — 상승 빨강, 하락 파랑, 화살표와 글자로도 알려줘요. */
export function IndexChange({ index }: { index: MarketIndex }) {
  const direction = index.change > 0 ? 'rise' : index.change < 0 ? 'fall' : 'flat';
  const arrow = { rise: '▲', fall: '▼', flat: '' }[direction];
  const word = { rise: '상승', fall: '하락', flat: '보합' }[direction];
  const sign = index.change_rate > 0 ? '+' : '';
  return (
    <span className={`${styles.change} ${styles[direction]}`} data-direction={direction}>
      <span aria-hidden="true">{arrow}</span>
      <span className="visually-hidden">어제보다 {word}</span>
      {formatNumber(Math.abs(index.change))} ({sign}
      {index.change_rate.toFixed(2)}%)
    </span>
  );
}

/** 코스피는 크게(그래도 시장 한마디보다는 작게), 코스닥은 옆에 작게 */
export function MarketIndexes({ indexes }: { indexes: MarketIndex[] }) {
  const kospi = indexes.find((i) => i.code === 'KOSPI');
  const others = indexes.filter((i) => i.code !== 'KOSPI');

  return (
    <div className={styles.indexes} aria-label="시장 지수">
      {kospi && (
        <div className={styles.main}>
          <p className={styles.indexName}>
            {indexName.KOSPI} <SampleBadge isSample={kospi.is_sample} />
          </p>
          <p className={styles.mainValue}>
            <strong>{formatNumber(kospi.value)}</strong>
            <IndexChange index={kospi} />
          </p>
          {kospi.intraday && (
            <Sparkline points={kospi.intraday} label={`${indexName.KOSPI} 오늘 흐름`} />
          )}
        </div>
      )}
      {others.map((index) => (
        <div key={index.code} className={styles.sub}>
          <p className={styles.indexName}>
            {indexName[index.code]} <SampleBadge isSample={index.is_sample} />
          </p>
          <p className={styles.subValue}>
            <strong>{formatNumber(index.value)}</strong>
            <IndexChange index={index} />
          </p>
        </div>
      ))}
    </div>
  );
}
