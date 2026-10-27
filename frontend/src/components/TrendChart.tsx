import { LabelList, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import styles from './BarChart.module.css';

export interface TrendPoint {
  date: string;
  value: number;
}

interface TrendChartProps {
  points: TrendPoint[];
  formatValue: (value: number) => string;
  ariaLabel: string;
  height?: number;
}

/** "2026-10-26" → "10.26" */
const shortDate = (date: string) => date.slice(5).replace('-', '.');

/** 점이 몇 개 안 되는 흐름 그래프. 점마다 숫자 값을 직접 보여줘요. */
export function TrendChart({ points, formatValue, ariaLabel, height = 200 }: TrendChartProps) {
  const reducedMotion = usePrefersReducedMotion();
  return (
    <div className={styles.chart} role="img" aria-label={ariaLabel} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 28, right: 24, left: 24, bottom: 0 }}>
          <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            axisLine={false}
            tickLine={false}
            interval={0}
            tick={{ fill: 'var(--text-3)', style: { fontSize: 'var(--fs-xs)' } }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--brand)"
            strokeWidth={2}
            dot={{ r: 4, fill: 'var(--brand)', strokeWidth: 0 }}
            animationDuration={600}
            isAnimationActive={!reducedMotion}
          >
            <LabelList
              dataKey="value"
              position="top"
              offset={10}
              formatter={(value) => formatValue(Number(value))}
              style={{ fill: 'var(--text-2)', fontSize: 'var(--fs-xs)', fontWeight: 700 }}
            />
          </Line>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
