import {
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import type { PriceInterval, PricePoint } from '../types';
import { formatPrice } from '../utils/format';
import {
  changeRate,
  evenDateTicks,
  extremeIndexes,
  formatVolume,
  MA_WINDOWS,
  movingAverage,
  priceAxisWidth,
  priceTicks,
  ticksAwayFrom,
} from '../utils/priceChartScale';
import { getTrend, trendColor } from '../utils/trend';
import styles from './PriceChart.module.css';

interface PriceChartProps {
  points: PricePoint[];
  /** 그래프 오른쪽 위 모서리에 띄우는 버튼 (예: 차트 크게 보기) */
  action?: ReactNode;
  /** 가격 칸 높이 (px). 날짜·거래량 칸은 따로 더해요. */
  height?: number;
  /** 캔들 하나의 길이. 없으면 기간으로 짐작해요 (반년이 넘으면 주, 아니면 일) */
  interval?: PriceInterval;
  /**
   * 주면 끌어서 옮기는 그래프가 돼요: 처음에 오른쪽 끝 캔들 이만큼을 보여 주고,
   * 오른쪽으로 끌면 그 앞의 과거 캔들이 나와요.
   */
  windowSize?: number;
  /**
   * 전일 종가. 일 캔들의 마지막(오늘) 등락률을 위쪽 현재가와 같은 기준으로 보여줘요.
   * 없으면 바로 앞 캔들의 종가를 기준으로 해요.
   */
  previousClose?: number | null;
}

/** 가격 칸 위·아래 여백: 최고가·최저가 표시가 들어가는 자리 (px) */
const PAD_TOP = 24;
const PAD_BOTTOM = 24;
/** 날짜 칸 높이 */
const DATE_ROW = 24;
/** 거래량 칸 높이 (거래량이 있을 때만) */
const VOLUME_HEIGHT = 56;
const VOLUME_GAP = 8;
/** 처음 그릴 때 폭 (실제 폭을 재기 전, 테스트 환경) */
const FALLBACK_WIDTH = 600;

const fullDate = (date: string) => date.replaceAll('-', '.');
/** 캔들 하나를 가리키는 값 (분 캔들은 날짜만으로는 겹쳐요) */
const pointKey = (p: PricePoint) => (p.time ? `${p.date} ${p.time}` : p.date);
/** 정보 줄·표에 쓰는 날짜: 분 캔들은 시각까지 */
const fullLabel = (p: PricePoint) => (p.time ? `${fullDate(p.date)} ${p.time}` : fullDate(p.date));

const UNIT_LABELS: Record<PriceInterval, string> = {
  '1min': '1분',
  '10min': '10분',
  '60min': '1시간',
  halfday: '반나절',
  day: '일',
  week: '주',
  month: '월',
  year: '년',
};

/** 아래 날짜 눈금 글자: 캔들 길이에 맞게 짧게 */
function tickLabel(p: PricePoint, interval: PriceInterval) {
  const [y, m, d] = p.date.split('-');
  if (interval === '1min') return p.time ?? '';
  if (interval === '10min') return `${m}.${d} ${p.time ?? ''}`.trim();
  if (interval === 'day' || interval === '60min' || interval === 'halfday') return `${m}.${d}`;
  if (interval === 'year') return y;
  return `${y.slice(2)}.${m}`;
}

/** 최고가·최저가 표시에 붙는 날짜 */
function markLabel(p: PricePoint, interval: PriceInterval) {
  if (interval === '1min') return p.time ?? '';
  if (interval === '10min') return tickLabel(p, interval);
  if (interval === '60min' || interval === 'halfday')
    return `${tickLabel(p, interval)} ${p.time ?? ''}`.trim();
  if (interval === 'day') return tickLabel(p, interval);
  if (interval === 'week') return fullDate(p.date).slice(2);
  return tickLabel(p, interval);
}
const axisNumber = (value: number) => Math.round(value).toLocaleString('ko-KR');
const signedRate = (rate: number) => `${rate > 0 ? '+' : ''}${rate.toFixed(2)}%`;
const rateClass = (rate: number | null) =>
  rate === null || rate === 0 ? styles.flat : rate > 0 ? styles.rise : styles.fall;
/** 캔들 하나의 색: 시가보다 종가가 높으면 빨강, 낮으면 파랑, 같으면 회색 */
const candleColor = (p: PricePoint) => trendColor[getTrend(p.open, p.close)];

/** 값이 없는 칸은 건너뛰어 선을 이어 그려요. */
function linePath(values: (number | null)[], x: (i: number) => number, y: (v: number) => number) {
  let d = '';
  let pen = false;
  values.forEach((v, i) => {
    if (v === null) {
      pen = false;
      return;
    }
    d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
    pen = true;
  });
  return d;
}

/** 위쪽 정보 줄: 날짜, 시가·고가·저가·종가 (전 캔들 종가 대비), 거래량, 이동평균선 값 */
function InfoBar({
  point,
  prevClose,
  averages,
  unit,
}: {
  point: PricePoint;
  prevClose: number | undefined;
  averages: { window: number; value: number | null }[];
  unit: string;
}) {
  const items = [
    ['시가', point.open],
    ['고가', point.high],
    ['저가', point.low],
    ['종가', point.close],
  ] as const;
  return (
    <div className={styles.info} data-testid="price-info">
      <p className={styles.infoRow}>
        <span className={styles.infoDate}>{fullLabel(point)}</span>
        {items.map(([label, value]) => {
          const rate = changeRate(value, prevClose);
          return (
            <span key={label} className={styles.infoItem}>
              <span className={styles.infoLabel}>{label}</span> {formatPrice(value)}
              {rate !== null && <span className={rateClass(rate)}> ({signedRate(rate)})</span>}
            </span>
          );
        })}
        {point.volume != null && (
          <span className={styles.infoItem}>
            <span className={styles.infoLabel}>거래량</span> {formatVolume(point.volume)}
          </span>
        )}
      </p>
      {averages.length > 0 && (
        <p className={styles.infoRow}>
          <span className={styles.infoLabel}>이동평균선({unit})</span>
          {averages.map(({ window, value }) => (
            <span key={window} className={styles.infoItem} data-ma-value={window}>
              <span className={styles.swatch} style={{ background: `var(--ma-${window})` }} />
              {window} {value === null ? '-' : formatPrice(Math.round(value))}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

/**
 * 주가 캔들 그래프 (증권 앱처럼).
 * - 캔들: 오른 날 빨강·내린 날 파랑, 이동평균선 5·20·60
 * - 기간 중 최고가·최저가 표시 (지금 가격과의 차이, 날짜)
 * - 현재가 점선과 오른쪽 가격 표시, 마우스·좌우 키로 움직이는 십자선과 위쪽 정보 줄
 * - 거래량이 있으면 아래 거래량 막대
 * 현재가 표시와 data-trend 는 기간 시작보다 올랐는지로 정해요 (utils/trend).
 */
export function PriceChart({
  points: allPoints,
  height = 220,
  interval: intervalProp,
  previousClose,
  windowSize,
  action,
}: PriceChartProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(FALLBACK_WIDTH);
  const [active, setActive] = useState<number | null>(null);
  const [pointerY, setPointerY] = useState<number | null>(null);
  /** 오른쪽 끝에서 가려 둔 캔들 수 (0 이면 가장 최근까지 보여요) */
  const [offset, setOffset] = useState(0);
  const drag = useRef<{ x: number; offset: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  // 기간을 바꾸면(창 크기·첫 캔들이 바뀌면) 다시 가장 최근으로
  const firstKey = allPoints[0] ? pointKey(allPoints[0]) : '';
  const [resetKey, setResetKey] = useState(`${firstKey}|${windowSize}`);
  if (resetKey !== `${firstKey}|${windowSize}`) {
    setResetKey(`${firstKey}|${windowSize}`);
    setOffset(0);
  }

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const measure = () => {
      if (box.clientWidth > 0) setWidth(box.clientWidth);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  // 가격 칸 폭은 전체 캔들의 최고가로 정해요 (끌어도 흔들리지 않게)
  const axisWidth = priceAxisWidth(Math.max(...allPoints.map((p) => p.high)));
  const plotWidth = Math.max(width - axisWidth, 1);

  // 보이는 캔들 구간: 끌어서 옮기는 그래프면 오른쪽 끝에서 offset 만큼 앞으로
  const total = allPoints.length;
  const count = windowSize === undefined ? total : Math.min(total, Math.max(windowSize, 1));
  const maxOffset = total - count;
  const shift = Math.min(offset, maxOffset);
  const start = total - count - shift;
  const points = allPoints.slice(start, start + count);
  const pannable = maxOffset > 0;

  const n = points.length;
  const first = points[0]?.close ?? 0;
  /** 지금 가격 (과거로 옮겨도 가장 최근 종가) */
  const last = allPoints.at(-1)?.close ?? 0;
  const trend = getTrend(points[0]?.close, points.at(-1)?.close);
  const color = trendColor[getTrend(points[0]?.close, last)];
  const allCloses = allPoints.map((p) => p.close);

  // 캔들 길이를 모르면(예전 응답) 반년이 넘는 기간은 주 단위로 봐요.
  const days =
    n > 1 ? (Date.parse(points[n - 1].date) - Date.parse(points[0].date)) / 86_400_000 : 0;
  const interval: PriceInterval = intervalProp ?? (days > 200 ? 'week' : 'day');
  const unit = UNIT_LABELS[interval];
  const keys = points.map(pointKey);

  // 기간의 2배 이상 캔들이 있을 때만 그려요. (짧으면 끝에 토막만 남아서) 예: 60일선은 6달부터
  // 이동평균은 보이는 구간 앞의 캔들까지 써서 구하고, 보이는 만큼만 그려요
  const averages = MA_WINDOWS.filter((w) => n >= w * 2 || (pannable && total >= w * 2)).map(
    (w) => ({
      window: w,
      values: movingAverage(allCloses, w).slice(start, start + count),
    }),
  );

  const low = Math.min(...points.map((p) => p.low));
  const high = Math.max(...points.map((p) => p.high));
  const pad = (high - low) * 0.04 || high * 0.01;
  const domain: [number, number] = [low - pad, high + pad];
  const step = plotWidth / Math.max(n, 1);
  const bodyWidth = Math.max(1, Math.min(12, step * 0.6));
  const x = (i: number) => step * (i + 0.5);
  const plotHeight = height - PAD_TOP - PAD_BOTTOM;
  const y = (v: number) => PAD_TOP + ((domain[1] - v) / (domain[1] - domain[0] || 1)) * plotHeight;
  const valueAt = (py: number) =>
    domain[1] - ((py - PAD_TOP) / plotHeight) * (domain[1] - domain[0]);

  const yTicks = ticksAwayFrom(priceTicks(domain[0], domain[1]), last, domain, plotHeight);
  const xTicks = evenDateTicks(keys, width < 480 ? 4 : width > 900 ? 8 : 5);
  const extremes = extremeIndexes(points);

  const volumes = points.map((p) => p.volume ?? 0);
  const hasVolume = volumes.some((v) => v > 0);
  const maxVolume = Math.max(...volumes, 1);
  const volumeTop = height + DATE_ROW + VOLUME_GAP;
  const totalHeight = height + DATE_ROW + (hasVolume ? VOLUME_GAP + VOLUME_HEIGHT : 0);

  const shown = active ?? n - 1;
  const shownPoint = points[shown];

  const moveBy = (candles: number) =>
    setOffset((cur) => Math.min(maxOffset, Math.max(0, Math.min(cur, maxOffset) + candles)));

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!pannable || e.button !== 0) return;
    drag.current = { x: e.clientX, offset: shift };
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDragging(true);
  };
  const endDrag = () => {
    drag.current = null;
    setDragging(false);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (drag.current) {
      // 오른쪽으로 끌면 과거가, 왼쪽으로 끌면 최근이 나와요
      const moved = Math.round((e.clientX - drag.current.x) / step);
      setOffset(Math.min(maxOffset, Math.max(0, drag.current.offset + moved)));
      setActive(null);
      setPointerY(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    setActive(Math.min(n - 1, Math.max(0, Math.floor(px / step))));
    setPointerY(py >= PAD_TOP && py <= height - PAD_BOTTOM && px <= plotWidth ? py : null);
  };
  const clear = () => {
    setActive(null);
    setPointerY(null);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1 };
    if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      setActive(e.key === 'Home' ? 0 : n - 1);
    } else if (moves[e.key] !== undefined) {
      e.preventDefault();
      const cur = active ?? n - 1;
      // 끝에서 더 가면 그래프를 한 칸 옮겨요
      if (pannable && cur === 0 && moves[e.key] < 0) moveBy(1);
      else if (pannable && cur === n - 1 && moves[e.key] > 0 && shift > 0) moveBy(-1);
      else setActive(Math.min(n - 1, Math.max(0, cur + moves[e.key])));
    } else if (e.key === 'Escape') {
      clear();
    }
  };

  /** 최고가·최저가 표시: 왼쪽·오른쪽 끝 근처면 글자를 안쪽으로 붙여요. */
  const extremeMark = (index: number, kind: 'high' | 'low') => {
    const price = kind === 'high' ? points[index].high : points[index].low;
    const rate = changeRate(last, price);
    const cx = x(index);
    const anchor = cx < plotWidth * 0.25 ? 'start' : cx > plotWidth * 0.75 ? 'end' : 'middle';
    const ty = kind === 'high' ? y(price) - 8 : y(price) + 16;
    const label = `${kind === 'high' ? '최고' : '최저'} ${formatPrice(price)} (${rate === null ? '-' : signedRate(rate)}, ${markLabel(points[index], interval)})`;
    return (
      <text
        key={kind}
        data-mark={kind}
        x={cx}
        y={ty}
        textAnchor={anchor}
        className={styles.markText}
        fill={kind === 'high' ? 'var(--rise)' : 'var(--fall)'}
      >
        {label}
      </text>
    );
  };

  /** 오른쪽 가격 칸에 붙는 상자 (현재가·십자선 가격) */
  const axisBox = (value: number, boxColor: string, key: string) => (
    <g key={key}>
      <rect
        x={plotWidth + 2}
        y={y(value) - 9}
        width={axisWidth - 2}
        height={18}
        rx={4}
        fill={boxColor}
      />
      <text
        x={plotWidth + axisWidth - 6}
        y={y(value) + 4}
        textAnchor="end"
        className={styles.axisBoxText}
        fill="var(--bg)"
      >
        {axisNumber(value)}
      </text>
    </g>
  );

  return (
    <div className={styles.root}>
      {shownPoint && (
        <InfoBar
          point={shownPoint}
          prevClose={
            interval === 'day' && previousClose && start + shown === allPoints.length - 1
              ? previousClose
              : allPoints[start + shown - 1]?.close
          }
          averages={averages.map((a) => ({ window: a.window, value: a.values[shown] }))}
          unit={unit}
        />
      )}
      <div className={styles.plot}>
        {action && <div className={styles.action}>{action}</div>}
        <div
          ref={boxRef}
          className={`${styles.chart} ${pannable ? styles.pannable : ''} ${dragging ? styles.dragging : ''}`}
          role="img"
          tabIndex={0}
          data-trend={trend}
          aria-label={`${points[0] ? fullLabel(points[0]) : ''}부터 ${points.at(-1) ? fullLabel(points.at(-1)!) : ''}까지 주가 흐름, ${formatPrice(first)}에서 ${formatPrice(points.at(-1)?.close ?? 0)}. 왼쪽·오른쪽 키로 날짜를 옮기면 위에 그날 가격이 나와요${pannable ? '. 그래프를 끌거나 끝에서 키를 더 누르면 지난 기간이 보여요' : ''}`}
          data-offset={shift}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={() => {
            if (!drag.current) clear();
          }}
          onBlur={clear}
          onKeyDown={onKeyDown}
        >
          <svg width={width} height={totalHeight} aria-hidden="true" className={styles.svg}>
            {/* 가격 눈금선·숫자 */}
            {yTicks.map((t) => (
              <g key={t}>
                <line x1={0} x2={plotWidth} y1={y(t)} y2={y(t)} className={styles.grid} />
                <text x={plotWidth + 8} y={y(t) + 4} className={styles.axisText}>
                  {axisNumber(t)}
                </text>
              </g>
            ))}

            {/* 캔들: 가는 꼬리는 고가~저가, 굵은 몸통은 시가~종가 */}
            <g shapeRendering="crispEdges">
              {points.map((p, i) => {
                const c = candleColor(p);
                const top = y(Math.max(p.open, p.close));
                const bodyHeight = Math.max(1, y(Math.min(p.open, p.close)) - top);
                const cx = Math.round(x(i)) + 0.5;
                return (
                  <g key={keys[i]} data-candle={keys[i]}>
                    <line x1={cx} x2={cx} y1={y(p.high)} y2={y(p.low)} stroke={c} />
                    <rect
                      x={cx - bodyWidth / 2}
                      y={top}
                      width={bodyWidth}
                      height={bodyHeight}
                      fill={c}
                    />
                  </g>
                );
              })}
            </g>

            {/* 이동평균선 */}
            {averages.map((a) => (
              <path
                key={a.window}
                d={linePath(a.values, x, y)}
                fill="none"
                stroke={`var(--ma-${a.window})`}
                strokeWidth={1.5}
                strokeLinejoin="round"
                data-ma={a.window}
              />
            ))}

            {/* 기간 중 최고가·최저가 */}
            {n > 1 && extremeMark(extremes.high, 'high')}
            {n > 1 && extremeMark(extremes.low, 'low')}

            {/* 현재가 점선 + 오른쪽 표시 (과거로 옮겨서 가격 칸 밖이면 숨겨요) */}
            {last >= domain[0] && last <= domain[1] && (
              <>
                <line
                  x1={0}
                  x2={plotWidth}
                  y1={y(last)}
                  y2={y(last)}
                  stroke={color}
                  strokeDasharray="2 3"
                  strokeOpacity={0.8}
                />
                {axisBox(last, color, 'last')}
              </>
            )}

            {/* 날짜 (처음은 왼쪽, 끝은 오른쪽 정렬이라 잘리지 않아요) */}
            {xTicks.map((key) => {
              const i = keys.indexOf(key);
              const anchor = key === xTicks[0] ? 'start' : key === xTicks.at(-1) ? 'end' : 'middle';
              return (
                <text
                  key={key}
                  x={x(i)}
                  y={height + 16}
                  textAnchor={anchor}
                  className={styles.axisText}
                >
                  {tickLabel(points[i], interval)}
                </text>
              );
            })}

            {/* 거래량 */}
            {hasVolume && (
              <g data-pane="volume">
                <line
                  x1={0}
                  x2={plotWidth}
                  y1={volumeTop + VOLUME_HEIGHT}
                  y2={volumeTop + VOLUME_HEIGHT}
                  className={styles.grid}
                />
                <text x={0} y={volumeTop + 10} className={styles.axisText}>
                  거래량
                </text>
                <text x={plotWidth + 8} y={volumeTop + 10} className={styles.axisText}>
                  {formatVolume(maxVolume)}
                </text>
                <g shapeRendering="crispEdges">
                  {points.map((p, i) => {
                    const h = ((p.volume ?? 0) / maxVolume) * (VOLUME_HEIGHT - 14);
                    return (
                      <rect
                        key={keys[i]}
                        x={Math.round(x(i)) + 0.5 - bodyWidth / 2}
                        y={volumeTop + VOLUME_HEIGHT - h}
                        width={bodyWidth}
                        height={h}
                        fill={candleColor(p)}
                        fillOpacity={0.55}
                      />
                    );
                  })}
                </g>
              </g>
            )}

            {/* 십자선: 세로는 날짜에 붙고, 가로는 마우스 높이의 가격 */}
            {active !== null && (
              <g data-crosshair="">
                <line
                  x1={x(active)}
                  x2={x(active)}
                  y1={0}
                  y2={totalHeight}
                  className={styles.crosshair}
                />
                {pointerY !== null && (
                  <>
                    <line
                      x1={0}
                      x2={plotWidth}
                      y1={pointerY}
                      y2={pointerY}
                      className={styles.crosshair}
                    />
                    {axisBox(valueAt(pointerY), 'var(--text-1)', 'pointer')}
                  </>
                )}
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* 화면 읽기 프로그램용: 그래프의 모든 값을 표로 */}
      <table className="visually-hidden">
        <caption>날짜별 시가·고가·저가·종가</caption>
        <thead>
          <tr>
            <th scope="col">날짜</th>
            <th scope="col">시가</th>
            <th scope="col">고가</th>
            <th scope="col">저가</th>
            <th scope="col">종가</th>
            {hasVolume && <th scope="col">거래량</th>}
          </tr>
        </thead>
        <tbody>
          {points.map((p, i) => (
            <tr key={keys[i]}>
              <th scope="row">{fullLabel(p)}</th>
              <td>{formatPrice(p.open)}</td>
              <td>{formatPrice(p.high)}</td>
              <td>{formatPrice(p.low)}</td>
              <td>{formatPrice(p.close)}</td>
              {hasVolume && <td>{p.volume == null ? '-' : formatVolume(p.volume)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
