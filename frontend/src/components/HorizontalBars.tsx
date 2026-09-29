import styles from './HorizontalBars.module.css';

export interface HorizontalBarDatum {
  id: string;
  label: string;
  value: number;
}

interface HorizontalBarsProps {
  data: HorizontalBarDatum[];
  formatValue: (value: number) => string;
}

/** 가로 막대. 가장 큰 항목만 브랜드 색으로 칠해요. */
export function HorizontalBars({ data, formatValue }: HorizontalBarsProps) {
  const max = Math.max(...data.map((d) => d.value), 0);
  return (
    <ul className={styles.list}>
      {data.map((d) => (
        <li key={d.id} className={styles.item}>
          <div className={styles.labels}>
            <span className={styles.label}>{d.label}</span>
            <span className={styles.value}>{formatValue(d.value)}</span>
          </div>
          <div className={styles.track}>
            <div
              className={`${styles.bar} ${d.value === max ? styles.top : ''}`}
              style={{ width: `${max ? (d.value / max) * 100 : 0}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
