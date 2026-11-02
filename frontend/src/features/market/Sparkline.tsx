import styles from './Market.module.css';

interface SparklineProps {
  points: { time: string; value: number }[];
  label: string;
}

/** 당일 흐름을 보여주는 작은 선 그래프. 거래 앱처럼 보이지 않게 회색 선만 그려요. */
export function Sparkline({ points, label }: SparklineProps) {
  if (points.length < 2) return null;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 120;
  const height = 36;
  const path = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - 2 - ((p.value - min) / range) * (height - 4);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg
      className={styles.sparkline}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label}
      preserveAspectRatio="none"
    >
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
