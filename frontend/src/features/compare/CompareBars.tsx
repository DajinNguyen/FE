import type { CSSProperties } from 'react';
import type { CompareCompany } from '../../types';
import { scaleBar } from '../../utils/scaleBar';
import { formatMetric, visibleMetrics, type CompareMetric } from './compareMetrics';
import styles from './CompareBars.module.css';

type Side = 'left' | 'right';

/** 막대 하나: 길이는 두 값 중 큰 값 기준 scaleBar 비율 (0에서 시작), 라벨은 막대 끝 바로 옆 */
function Bar({
  metric,
  company,
  side,
  max,
  strong,
}: {
  metric: CompareMetric;
  company: CompareCompany;
  side: Side;
  max: number;
  strong: boolean;
}) {
  const value = company[metric.key];
  if (value === null) {
    return (
      <div className={`${styles.cell} ${styles[side]}`}>
        <span className={styles.none}>자료 없음</span>
      </div>
    );
  }
  const loss = metric.lossWhenNegative && value < 0;
  const ratio = { '--ratio': scaleBar(value, max) } as CSSProperties;
  return (
    <div className={`${styles.cell} ${styles[side]}`}>
      <span
        className={`${styles.bar} ${styles[side === 'left' ? 'barLeft' : 'barRight']} ${value < 0 ? styles.negative : ''}`}
        style={ratio}
        data-bar={side}
      />
      <span
        className={`${styles.value} ${strong ? styles.strong : ''}`}
        data-label={side}
        data-strong={strong || undefined}
      >
        {loss && <span className={styles.loss}>적자 </span>}
        {formatMetric(metric, value, company.unit)}
      </span>
    </div>
  );
}

/**
 * 지표별 두 회사 막대. 가운데 지표 이름, 왼쪽 회사는 왼쪽으로, 오른쪽 회사는 오른쪽으로 뻗어요.
 * 큰 쪽 숫자만 굵게(600) 하고, 색으로 이기고 지는 것을 나타내지 않아요. (두 회사 색은 회사 구분용)
 * 휴대폰(768px 미만)에서는 지표마다 두 막대를 위아래로 놓아요.
 */
export function CompareBars({ left, right }: { left: CompareCompany; right: CompareCompany }) {
  return (
    <div className={styles.wrap}>
      {/* 휴대폰: 위에 두 회사 이름 칩 (막대 색과 같은 점) */}
      <ul className={styles.legend} aria-hidden="true">
        <li>
          <span className={`${styles.dot} ${styles.barLeft}`} />
          {left.name}
        </li>
        <li>
          <span className={`${styles.dot} ${styles.barRight}`} />
          {right.name}
        </li>
      </ul>
      <dl className={styles.rows}>
        {visibleMetrics(left, right).map((metric) => {
          const a = left[metric.key];
          const b = right[metric.key];
          const max = Math.max(Math.abs(a ?? 0), Math.abs(b ?? 0));
          const leftStrong = a !== null && b !== null && a > b;
          const rightStrong = a !== null && b !== null && b > a;
          return (
            <div key={metric.key} className={styles.row} data-metric={metric.key}>
              <dt className={styles.label}>{metric.label}</dt>
              <dd className={styles.pair}>
                <span className="visually-hidden">{left.name}</span>
                <Bar metric={metric} company={left} side="left" max={max} strong={leftStrong} />
                <span className="visually-hidden">{right.name}</span>
                <Bar metric={metric} company={right} side="right" max={max} strong={rightStrong} />
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
