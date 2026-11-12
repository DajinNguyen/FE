import { Bar, ComposedChart, LabelList, Line, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import type { QuarterPerformance } from '../../types';
import styles from './PerformanceAnalysis.module.css';

const labelStyle = { fontSize: 'var(--fs-xs)', fontWeight: 'var(--fw-semibold)' };

/**
 * 분기별 흐름: 매출·영업이익 막대 + 영업이익률 선. 모든 값을 그래프 위에 적어요.
 * 막대는 아래쪽, 선은 위쪽에 그려서 숫자가 겹치지 않게 해요. 휴대폰에서는 옆으로 밀어서 봐요.
 */
export function QuarterlyChart({ data, unit }: { data: QuarterPerformance[]; unit: string }) {
  const reducedMotion = usePrefersReducedMotion();
  const money = data.flatMap((d) => [d.revenue, d.operating_income]);
  const moneyMax = Math.max(...money, 0);
  const moneyMin = Math.min(...money, 0);
  const rates = data.map((d) => d.operating_margin);
  const rateMax = Math.max(...rates);
  const rateMin = Math.min(...rates);
  const rateRange = rateMax - rateMin || 1;
  const money1 = (v: number) => v.toLocaleString('ko-KR', { maximumFractionDigits: 1 });

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
        <li className={styles.legendUnit}>단위: {unit}, %</li>
      </ul>
      <div className={styles.chartScroll}>
        <div className={styles.chart} aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 24, right: 12, left: 12, bottom: 0 }}>
              <XAxis
                dataKey="quarter"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-3)', style: { fontSize: 'var(--fs-xs)' } }}
              />
              {/* 막대는 아래 절반, 선은 위쪽에 오도록 축 범위를 나눠요 */}
              <YAxis yAxisId="money" hide domain={[moneyMin, moneyMax * 1.9 || 1]} />
              <YAxis
                yAxisId="rate"
                hide
                domain={[rateMin - rateRange * 2.4, rateMax + rateRange * 0.25]}
              />
              <Bar
                yAxisId="money"
                dataKey="revenue"
                fill="var(--chart-muted)"
                radius={[2, 2, 0, 0]}
                maxBarSize={28}
                isAnimationActive={!reducedMotion}
              >
                <LabelList
                  dataKey="revenue"
                  position="top"
                  formatter={(v) => money1(Number(v))}
                  style={{ ...labelStyle, fill: 'var(--text-2)' }}
                />
              </Bar>
              <Bar
                yAxisId="money"
                dataKey="operating_income"
                fill="var(--brand)"
                radius={[2, 2, 0, 0]}
                maxBarSize={28}
                isAnimationActive={!reducedMotion}
              >
                <LabelList
                  dataKey="operating_income"
                  position="top"
                  formatter={(v) => money1(Number(v))}
                  style={{ ...labelStyle, fill: 'var(--brand-strong)' }}
                />
              </Bar>
              <Line
                yAxisId="rate"
                dataKey="operating_margin"
                stroke="var(--text-2)"
                strokeWidth={2}
                dot={{ r: 3, fill: 'var(--text-2)', strokeWidth: 0 }}
                isAnimationActive={!reducedMotion}
              >
                <LabelList
                  dataKey="operating_margin"
                  position="top"
                  formatter={(v) => `${Number(v).toFixed(1)}%`}
                  style={{ ...labelStyle, fill: 'var(--text-1)' }}
                />
              </Line>
            </ComposedChart>
          </ResponsiveContainer>
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
                {money1(d.revenue)}
                {unit}
              </td>
              <td>
                {money1(d.operating_income)}
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
