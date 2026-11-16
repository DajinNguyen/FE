import { scaleBar } from '../utils/scaleBar';
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

/** 가로 막대. 길이는 scaleBar(값 ÷ 가장 큰 값), 가장 큰 항목만 브랜드 색으로 칠해요. */
export function HorizontalBars({ data, formatValue }: HorizontalBarsProps) {
  const max = Math.max(...data.map((d) => Math.abs(d.value)), 0);
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
              data-bar={d.id}
              // 0 이 아닌 아주 작은 값도 1px 은 보이게
              style={{ width: `${scaleBar(d.value, max) * 100}%`, minWidth: d.value ? 1 : 0 }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
