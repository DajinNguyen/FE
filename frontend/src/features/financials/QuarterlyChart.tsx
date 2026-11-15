import type { CSSProperties } from 'react';
import type { QuarterPerformance } from '../../types';
import { barLength, niceTicks } from '../../utils/scaleBar';
import styles from './QuarterlyChart.module.css';

/** 막대 영역 높이 (px, 고정) */
export const BAR_AREA = 180;
/** 영업이익률 선 영역 높이 (px, 고정) */
const LINE_AREA = 56;
/** 막대 끝 위·아래에 숫자 라벨이 들어가는 자리 (px). 축 범위와 상관없이 따로 둬요. */
const LABEL_ROOM = 22;
/** 선 위 % 라벨 자리 (px) */
const LINE_LABEL_ROOM = 28;
/** 라벨과 막대 끝 사이 (px) */
export const LABEL_GAP = 5;

/** 숫자 라벨 높이 (px, CSS line-height 1 × 글자 크기) */
const LABEL_HEIGHT = 13;

const money = (v: number) => v.toFixed(1);

type LabelPlace = 'outside' | 'inside';

/**
 * 한 분기의 두 막대(매출·영업이익) 라벨 자리. 기본은 막대 끝 바로 밖이에요.
 * 두 막대 끝 높이가 비슷해 바깥 라벨끼리 겹치면, 짧은 막대의 라벨을 막대 안쪽 끝에 대비되는 색으로 넣어요.
 * (막대가 라벨보다 짧으면 안에 넣지 않고 밖에 둬요.) 값은 부호 있는 막대 길이(px)예요.
 */
export function placeLabels(a: number, b: number): [LabelPlace, LabelPlace] {
  const sameSide = Math.sign(a) === Math.sign(b);
  const overlap = sameSide && Math.abs(Math.abs(a) - Math.abs(b)) < LABEL_HEIGHT + 2;
  if (!overlap) return ['outside', 'outside'];
  const fits = (len: number) => Math.abs(len) >= LABEL_HEIGHT + LABEL_GAP * 2;
  if (Math.abs(a) <= Math.abs(b)) return fits(a) ? ['inside', 'outside'] : ['outside', 'outside'];
  return fits(b) ? ['outside', 'inside'] : ['outside', 'outside'];
}

/**
 * 분기별 흐름: 위 영업이익률(%) 선, 아래 매출·영업이익 막대. 두 그래프가 분기 칸을 같이 써요.
 * 막대는 0 기준선에서 시작하고 길이는 scaleBar 비율 그대로예요 (매출·영업이익 같은 축, 적자는 아래로).
 * 휴대폰에서는 옆으로 밀어서 봐요.
 */
export function QuarterlyChart({ data, unit }: { data: QuarterPerformance[]; unit: string }) {
  const values = data.flatMap((d) => [d.revenue, d.operating_income]);
  const max = Math.max(0, ...values);
  const min = Math.min(0, ...values);
  const range = max - min || 1;
  const above = (BAR_AREA * max) / range;
  const hasNegative = min < 0;
  const baseline = LABEL_ROOM + above;
  const barPanel = LABEL_ROOM + BAR_AREA + (hasNegative ? LABEL_ROOM : 0);

  const rates = data.map((d) => d.operating_margin);
  const rateMin = Math.min(0, ...rates);
  const rateMax = Math.max(...rates, rateMin + 1);
  const rateY = (r: number) => LINE_LABEL_ROOM + ((rateMax - r) / (rateMax - rateMin)) * LINE_AREA;
  const linePanel = LINE_LABEL_ROOM + LINE_AREA;
  const n = data.length;
  const columns = { '--columns': n } as CSSProperties;

  const bar = (value: number, kind: 'revenue' | 'income', place: LabelPlace) => {
    const length = barLength(value, range, BAR_AREA);
    const up = value >= 0;
    const position = up
      ? { bottom: barPanel - baseline, height: length }
      : { top: baseline, height: length };
    // 라벨은 막대 끝을 따라가요: 밖이면 끝에서 LABEL_GAP 만큼 떨어져, 안이면 끝 안쪽으로 LABEL_GAP
    const offset = place === 'outside' ? length + LABEL_GAP : length - LABEL_GAP - LABEL_HEIGHT;
    const label = up ? { bottom: barPanel - baseline + offset } : { top: baseline + offset };
    return (
      <div className={`${styles.barSlot} ${styles[kind]}`}>
        <div className={styles.bar} data-bar={kind} style={position} />
        <span
          className={`${styles.barLabel} ${place === 'inside' ? styles.inside : ''}`}
          data-label={kind}
          data-place={place}
          style={label}
        >
          {money(value)}
        </span>
      </div>
    );
  };

  return (
    <div>
      <ul className={styles.legend} aria-hidden="true">
        <li>
          <span className={`${styles.swatch} ${styles.swatchRevenue}`} /> 매출
        </li>
        <li>
          <span className={`${styles.swatch} ${styles.swatchIncome}`} /> 영업이익
        </li>
        <li>
          <span className={`${styles.swatch} ${styles.swatchMargin}`} /> 영업이익률
        </li>
        <li className={styles.legendUnit}>막대 단위: {unit} · 선 단위: %</li>
      </ul>
      <div className={styles.scroll}>
        <div className={styles.chart} aria-hidden="true">
          {/* 영업이익률 선 + 오른쪽 % 축 */}
          <div className={styles.panel} style={{ height: linePanel }}>
            <div className={styles.plot} style={columns}>
              <svg
                className={styles.line}
                viewBox={`0 0 ${n * 100} ${linePanel}`}
                preserveAspectRatio="none"
              >
                <polyline
                  points={rates.map((r, i) => `${i * 100 + 50},${rateY(r)}`).join(' ')}
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              {rates.map((r, i) => (
                <span
                  key={data[i].quarter}
                  className={styles.dot}
                  style={{ left: `${((i + 0.5) / n) * 100}%`, top: rateY(r) }}
                >
                  <span className={styles.dotLabel}>{r.toFixed(1)}%</span>
                </span>
              ))}
            </div>
            <div className={styles.axis}>
              <span style={{ top: rateY(rateMax) }}>{rateMax.toFixed(0)}%</span>
              <span style={{ top: rateY(rateMin) }}>{rateMin.toFixed(0)}%</span>
            </div>
          </div>

          {/* 매출·영업이익 막대 + 오른쪽 금액 축 */}
          <div className={styles.panel} style={{ height: barPanel }}>
            <div className={styles.plot} style={columns}>
              {niceTicks(max).map((t) => (
                <div
                  key={t}
                  className={t === 0 ? styles.zero : styles.grid}
                  style={{ top: baseline - (t / range) * BAR_AREA }}
                />
              ))}
              {data.map((d) => {
                const [revenuePlace, incomePlace] = placeLabels(
                  barLength(d.revenue, range, BAR_AREA) * Math.sign(d.revenue || 1),
                  barLength(d.operating_income, range, BAR_AREA) *
                    Math.sign(d.operating_income || 1),
                );
                return (
                  <div key={d.quarter} className={styles.column}>
                    {bar(d.revenue, 'revenue', revenuePlace)}
                    {bar(d.operating_income, 'income', incomePlace)}
                  </div>
                );
              })}
            </div>
            <div className={styles.axis}>
              {niceTicks(max).map((t) => (
                <span key={t} style={{ top: baseline - (t / range) * BAR_AREA }}>
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.quarters} style={columns}>
              {data.map((d) => (
                <span key={d.quarter}>{d.quarter}</span>
              ))}
            </div>
            <div className={styles.axis} />
          </div>
        </div>
      </div>
      {/* 화면 읽기 프로그램용: 그래프의 모든 값을 표로 */}
      <table className="visually-hidden">
        <caption>분기별 매출·영업이익·영업이익률</caption>
        <thead>
          <tr>
            <th scope="col">분기</th>
            <th scope="col">매출</th>
            <th scope="col">영업이익</th>
            <th scope="col">영업이익률</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.quarter}>
              <th scope="row">{d.quarter}</th>
              <td>
                {money(d.revenue)}
                {unit}
              </td>
              <td>
                {money(d.operating_income)}
                {unit}
              </td>
              <td>{d.operating_margin.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
