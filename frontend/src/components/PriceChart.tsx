import { useId } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from 'recharts';
import type { PricePoint } from '../types';
import { formatPrice } from '../utils/format';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import styles from './PriceChart.module.css';

interface PriceChartProps {
  points: PricePoint[];
  height?: number;
}

const formatDate = (date: string) => date.replaceAll('-', '.');

/** 주가 흐름 그래프. 기간 동안 올랐으면 빨강, 내렸으면 파랑이에요. */
export function PriceChart({ points, height = 200 }: PriceChartProps) {
  const gradientId = useId().replaceAll(':', '');
  const reducedMotion = usePrefersReducedMotion();
  const first = points[0]?.close ?? 0;
  const last = points.at(-1)?.close ?? 0;
  const color = last >= first ? 'var(--rise)' : 'var(--fall)';

  return (
    <div
      className={styles.chart}
      style={{ height }}
      role="img"
      aria-label={`${formatDate(points[0]?.date ?? '')}부터 ${formatDate(points.at(-1)?.date ?? '')}까지 주가 흐름, ${formatPrice(first)}에서 ${formatPrice(last)}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.2 }} />
              <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          <YAxis hide domain={['dataMin', 'dataMax']} />
          <Tooltip
            cursor={{ stroke: 'var(--text-4)', strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              const point = payload?.[0]?.payload as PricePoint | undefined;
              if (!active || !point) return null;
              return (
                <div className={styles.tooltip}>
                  <span className={styles.tooltipDate}>{formatDate(point.date)}</span>
                  <strong>{formatPrice(point.close)}</strong>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="close"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
            animationDuration={600}
            isAnimationActive={!reducedMotion}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
