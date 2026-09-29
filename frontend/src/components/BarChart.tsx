import {
  Bar,
  BarChart as RechartsBarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  XAxis,
} from 'recharts';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import styles from './BarChart.module.css';

export interface BarDatum {
  label: string;
  value: number;
  highlight?: boolean;
}

interface BarChartProps {
  data: BarDatum[];
  formatValue: (value: number) => string;
  /** 스크린리더용 차트 설명 */
  ariaLabel: string;
  height?: number;
}

/** 세로 막대 차트. highlight 인 막대(보통 최신 연도)만 진하게 칠해요. */
export function BarChart({ data, formatValue, ariaLabel, height = 200 }: BarChartProps) {
  const reducedMotion = usePrefersReducedMotion();
  return (
    <div className={styles.chart} role="img" aria-label={ariaLabel} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} margin={{ top: 28, right: 8, left: 8, bottom: 0 }}>
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--text-3)', fontSize: 13 }}
          />
          <Bar
            dataKey="value"
            radius={[10, 10, 4, 4]}
            maxBarSize={56}
            animationDuration={700}
            isAnimationActive={!reducedMotion}
          >
            {data.map((d) => (
              <Cell key={d.label} fill={d.highlight ? 'var(--brand)' : 'var(--brand-muted)'} />
            ))}
            <LabelList
              dataKey="value"
              position="top"
              formatter={(value) => formatValue(Number(value))}
              style={{ fill: 'var(--text-2)', fontSize: 13, fontWeight: 700 }}
            />
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
