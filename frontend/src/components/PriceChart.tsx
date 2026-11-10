import {
  Bar,
  BarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type BarShapeProps,
} from 'recharts';
import type { PricePoint } from '../types';
import { formatPrice } from '../utils/format';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { getTrend, trendColor } from '../utils/trend';
import styles from './PriceChart.module.css';

interface PriceChartProps {
  points: PricePoint[];
  height?: number;
}

type CandleDatum = PricePoint & { range: [number, number] };

const AXIS_WIDTH = 60;
const axisTick = { fill: 'var(--text-4)', style: { fontSize: 'var(--fs-xs)' } };

const formatDate = (date: string) => date.replaceAll('-', '.');
const formatAxisPrice = (value: number) => value.toLocaleString('ko-KR');

/** 가격 눈금: 범위를 3~4칸으로 나누는 1·2·2.5·5 단위의 딱 떨어지는 값들 */
function priceTicks(min: number, max: number) {
  const raw = (max - min) / 4;
  const magnitude = 10 ** Math.floor(Math.log10(raw || 1));
  const unit = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((u) => u >= raw) ?? raw;
  const ticks = [];
  for (let v = Math.ceil(min / unit) * unit; v <= max; v += unit) ticks.push(v);
  return ticks;
}

/** 캔들 하나의 색: 시가보다 종가가 높으면 빨강, 낮으면 파랑, 같으면 회색 */
const candleColor = (p: PricePoint) => trendColor[getTrend(p.open, p.close)];

/**
 * 캔들 하나. Bar 는 저가~고가 범위를 받아 그 높이를 주므로, 그 안에서 시가·종가 위치를 비율로 찾아요.
 * 가는 세로선(꼬리)은 고가~저가, 굵은 몸통은 시가~종가예요.
 */
function Candle({ x, y, width, height, payload }: BarShapeProps) {
  const p = payload as CandleDatum;
  const color = candleColor(p);
  const span = p.high - p.low || 1;
  const toY = (value: number) => y + ((p.high - value) / span) * height;
  const bodyTop = toY(Math.max(p.open, p.close));
  const bodyHeight = Math.max(1, toY(Math.min(p.open, p.close)) - bodyTop);
  const bodyWidth = Math.max(2, Math.min(12, width));
  const center = Math.round(x + width / 2) + 0.5;
  return (
    <g shapeRendering="crispEdges">
      <line x1={center} x2={center} y1={y} y2={y + Math.max(height, 1)} stroke={color} />
      <rect
        x={center - bodyWidth / 2}
        y={bodyTop}
        width={bodyWidth}
        height={bodyHeight}
        fill={color}
      />
    </g>
  );
}

/** 오른쪽 가격 눈금 자리에 붙는 현재가(마지막 종가) 표시 */
function LastPriceLabel({
  viewBox,
  value,
  color,
}: {
  viewBox?: { x: number; y: number; width: number };
  value: number;
  color: string;
}) {
  if (!viewBox) return null;
  const right = viewBox.x + viewBox.width;
  return (
    <g>
      <rect
        x={right + 2}
        y={viewBox.y - 9}
        width={AXIS_WIDTH - 2}
        height={18}
        rx={4}
        fill={color}
      />
      <text
        x={right + AXIS_WIDTH - 4}
        y={viewBox.y + 4}
        textAnchor="end"
        fill="var(--bg)"
        fontSize="var(--fs-xs)"
        style={{ fontWeight: 'var(--fw-semibold)' }}
      >
        {formatAxisPrice(value)}
      </text>
    </g>
  );
}

/**
 * 주가 흐름 캔들 그래프. 캔들마다 오른 날 빨강·내린 날 파랑이고,
 * 현재가 표시와 data-trend 는 기간 시작보다 올랐는지로 정해요 (utils/trend)
 */
export function PriceChart({ points, height = 200 }: PriceChartProps) {
  const reducedMotion = usePrefersReducedMotion();
  const first = points[0]?.close ?? 0;
  const last = points.at(-1)?.close ?? 0;
  const trend = getTrend(points[0]?.close, points.at(-1)?.close);
  const color = trendColor[trend];

  const data: CandleDatum[] = points.map((p) => ({ ...p, range: [p.low, p.high] }));
  const low = Math.min(...points.map((p) => p.low));
  const high = Math.max(...points.map((p) => p.high));
  const pad = (high - low) * 0.06 || high * 0.01;
  // 반년이 넘는 기간은 날짜 대신 "26.03" 처럼 연·월만 보여요.
  const days =
    points.length > 1
      ? (Date.parse(points.at(-1)!.date) - Date.parse(points[0].date)) / 86_400_000
      : 0;
  const formatTick = (date: string) =>
    days > 200
      ? `${date.slice(2, 4)}.${date.slice(5, 7)}`
      : `${date.slice(5, 7)}.${date.slice(8, 10)}`;

  return (
    <div
      className={styles.chart}
      style={{ height }}
      role="img"
      data-trend={trend}
      aria-label={`${formatDate(points[0]?.date ?? '')}부터 ${formatDate(points.at(-1)?.date ?? '')}까지 주가 흐름, ${formatPrice(first)}에서 ${formatPrice(last)}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          barCategoryGap="30%"
          margin={{ top: 8, right: 0, bottom: 0, left: 0 }}
        >
          <XAxis
            dataKey="date"
            tickFormatter={formatTick}
            axisLine={false}
            tickLine={false}
            tick={axisTick}
            minTickGap={24}
            interval="preserveStartEnd"
          />
          <YAxis
            orientation="right"
            width={AXIS_WIDTH}
            domain={[low - pad, high + pad]}
            ticks={priceTicks(low - pad, high + pad)}
            tickFormatter={formatAxisPrice}
            axisLine={false}
            tickLine={false}
            tick={axisTick}
          />
          <Tooltip
            cursor={{ fill: 'var(--text-4)', fillOpacity: 0.15 }}
            content={({ active, payload }) => {
              const point = payload?.[0]?.payload as CandleDatum | undefined;
              if (!active || !point) return null;
              return (
                <div className={styles.tooltip}>
                  <span className={styles.tooltipDate}>{formatDate(point.date)}</span>
                  <strong>{formatPrice(point.close)}</strong>
                </div>
              );
            }}
          />
          <ReferenceLine
            y={last}
            stroke={color}
            strokeDasharray="2 3"
            strokeOpacity={0.7}
            label={(props: { viewBox?: { x: number; y: number; width: number } }) => (
              <LastPriceLabel viewBox={props.viewBox} value={last} color={color} />
            )}
          />
          <Bar
            dataKey="range"
            shape={Candle}
            animationDuration={600}
            isAnimationActive={!reducedMotion}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
