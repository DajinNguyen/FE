import {
  Bar,
  BarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type BarShapeProps,
  type XAxisTickContentProps,
} from 'recharts';
import type { PricePoint } from '../types';
import { formatPrice } from '../utils/format';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { evenDateTicks, priceAxisWidth, priceTicks, ticksAwayFrom } from '../utils/priceChartScale';
import { getTrend, trendColor } from '../utils/trend';
import styles from './PriceChart.module.css';

interface PriceChartProps {
  points: PricePoint[];
  height?: number;
}

type CandleDatum = PricePoint & { range: [number, number] };

/** 위 여백·아래 날짜 칸 높이 (px). 그래프 안쪽 높이 = height − 둘의 합 */
const MARGIN_TOP = 12;
const X_AXIS_HEIGHT = 30;
const axisTick = { fill: 'var(--text-4)', style: { fontSize: 'var(--fs-xs)' } };

const formatDate = (date: string) => date.replaceAll('-', '.');
const formatAxisPrice = (value: number) => value.toLocaleString('ko-KR');

/** 날짜 눈금: 처음은 왼쪽 정렬, 끝은 오른쪽 정렬이라 그래프 밖으로 잘리지 않아요. */
function DateTick({
  x,
  y,
  payload,
  first,
  last,
  format,
}: {
  x?: number;
  y?: number;
  payload?: { value: string };
  first: string;
  last: string;
  format: (date: string) => string;
}) {
  if (x === undefined || y === undefined || !payload) return null;
  const anchor = payload.value === first ? 'start' : payload.value === last ? 'end' : 'middle';
  return (
    <text x={x} y={y + 12} textAnchor={anchor} fill={axisTick.fill} style={axisTick.style}>
      {format(payload.value)}
    </text>
  );
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
  width,
}: {
  viewBox?: { x: number; y: number; width: number };
  value: number;
  color: string;
  width: number;
}) {
  if (!viewBox) return null;
  const right = viewBox.x + viewBox.width;
  return (
    <g>
      <rect x={right + 2} y={viewBox.y - 9} width={width - 2} height={18} rx={4} fill={color} />
      <text
        x={right + width - 6}
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
  const domain: [number, number] = [low - pad, high + pad];
  const axisWidth = priceAxisWidth(high);
  // 현재가 표시와 겹치는 눈금은 빼요.
  const yTicks = ticksAwayFrom(
    priceTicks(domain[0], domain[1]),
    last,
    domain,
    height - MARGIN_TOP - X_AXIS_HEIGHT,
  );
  // 날짜는 처음·끝 포함 같은 간격으로 (좁은 화면 4개)
  const xTicks = evenDateTicks(
    points.map((p) => p.date),
    height < 180 ? 4 : 5,
  );
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
          margin={{ top: MARGIN_TOP, right: 0, bottom: 0, left: 0 }}
        >
          <XAxis
            dataKey="date"
            tickFormatter={formatTick}
            axisLine={false}
            tickLine={false}
            tick={(props: XAxisTickContentProps) => (
              <DateTick
                x={Number(props.x)}
                y={Number(props.y)}
                payload={props.payload as { value: string }}
                first={xTicks[0]}
                last={xTicks.at(-1)!}
                format={formatTick}
              />
            )}
            ticks={xTicks}
            interval={0}
            height={X_AXIS_HEIGHT}
          />
          <YAxis
            orientation="right"
            width={axisWidth}
            domain={domain}
            ticks={yTicks}
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
                  <strong>종가 {formatPrice(point.close)}</strong>
                  <dl className={styles.tooltipRows}>
                    <div>
                      <dt>시가</dt>
                      <dd>{formatPrice(point.open)}</dd>
                    </div>
                    <div>
                      <dt>고가</dt>
                      <dd>{formatPrice(point.high)}</dd>
                    </div>
                    <div>
                      <dt>저가</dt>
                      <dd>{formatPrice(point.low)}</dd>
                    </div>
                  </dl>
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
              <LastPriceLabel
                viewBox={props.viewBox}
                value={last}
                color={color}
                width={axisWidth}
              />
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
