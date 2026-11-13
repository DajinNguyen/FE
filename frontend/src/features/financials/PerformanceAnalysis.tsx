import type { ReactNode } from 'react';
import { ApiError } from '../../api/errors';
import { ErrorState } from '../../components/ErrorState';
import { Icon } from '../../components/Icon';
import { Section } from '../../components/Section';
import { usePerformanceDetail } from '../../hooks/usePerformanceDetail';
import type { PerformanceDetail } from '../../types';
import { formatSignedPercent } from '../../utils/format';
import { QuarterlyChart } from './QuarterlyChart';
import styles from './PerformanceAnalysis.module.css';

/** 개요 [자세히 보기]가 스크롤해 오는 위치 */
export const PERFORMANCE_ANCHOR = 'performance-analysis';

const TITLE = '최근 사업 성과 분석';
const NO_DATA = '자료가 없어요';

/** "2026-01-29" → "2026년 1월 29일" */
const fullDate = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  return d ? `${y}년 ${m}월 ${d}일` : date;
};

/** "2026-01-29" → "1월 29일" */
const shortDate = (date: string) => {
  const [, m, d] = date.split('-').map(Number);
  return d ? `${m}월 ${d}일` : date;
};

/** ▲ +23.7% / ▼ -3.2% (늘면 빨강, 줄면 파랑) */
function ChangeRate({ rate }: { rate: number | null }) {
  if (rate === null) return <span className={styles.muted}>{NO_DATA}</span>;
  const up = rate >= 0;
  return (
    <span className={up ? styles.rise : styles.fall}>
      <span aria-hidden="true">{up ? '▲' : '▼'}</span>
      <span className="visually-hidden">{up ? '늘었어요' : '줄었어요'}</span>{' '}
      {formatSignedPercent(rate, 1)}
    </span>
  );
}

/** 분석 안의 작은 덩어리 하나. 자료가 없으면 이 덩어리만 "자료가 없어요" */
function Block({ title, empty, children }: { title: string; empty: boolean; children: ReactNode }) {
  return (
    <div className={styles.block}>
      <h3 className={styles.blockTitle}>{title}</h3>
      {empty ? <p className={styles.muted}>{NO_DATA}</p> : children}
    </div>
  );
}

function Analysis({ data }: { data: PerformanceDetail }) {
  const { unit, summary, quarterly } = data;
  const money = (v: number) => `${v.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}${unit}`;
  // 비교 기준 값은 분기 흐름에서 찾아요 (최근 분기 = 맨 끝, 작년 같은 분기 = 4분기 전)
  const last = quarterly.length - 1;
  const comparisons = [
    { label: '작년 같은 분기보다', change: data.yoy, base: quarterly[last - 4] },
    { label: '지난 분기보다', change: data.qoq, base: quarterly[last - 1] },
  ];

  return (
    <>
      <Block title="실적 요약" empty={!summary}>
        {summary && (
          <dl className={styles.summary}>
            <div>
              <dt>매출</dt>
              <dd>{money(summary.revenue)}</dd>
            </div>
            <div>
              <dt>영업이익</dt>
              <dd>{money(summary.operating_income)}</dd>
            </div>
            <div>
              <dt>영업이익률</dt>
              <dd>{summary.operating_margin.toFixed(1)}%</dd>
            </div>
          </dl>
        )}
      </Block>

      <Block title="이전과 비교" empty={!data.yoy && !data.qoq}>
        <div className={styles.compare}>
          {comparisons.map(({ label, change, base }) => (
            <div key={label} className={styles.compareCard}>
              <p className={styles.compareLabel}>
                {label}
                {base && <span className={styles.muted}> ({base.quarter})</span>}
              </p>
              {change ? (
                <dl>
                  <div className={styles.compareRow}>
                    <dt>매출</dt>
                    <dd>
                      {base && <span className={styles.base}>{money(base.revenue)} → </span>}
                      <ChangeRate rate={change.revenue_rate} />
                    </dd>
                  </div>
                  <div className={styles.compareRow}>
                    <dt>영업이익</dt>
                    <dd>
                      {base && (
                        <span className={styles.base}>{money(base.operating_income)} → </span>
                      )}
                      <ChangeRate rate={change.operating_income_rate} />
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className={styles.muted}>{NO_DATA}</p>
              )}
            </div>
          ))}
        </div>
      </Block>

      <Block title={`분기별 흐름 (최근 ${quarterly.length}분기)`} empty={quarterly.length === 0}>
        <QuarterlyChart data={quarterly} unit={unit} />
      </Block>

      <Block title="사업별 성과" empty={data.segments.length === 0}>
        <ul className={styles.segments}>
          {data.segments.map((s) => (
            <li key={s.name} className={styles.segment}>
              <p className={styles.segmentName}>{s.name}</p>
              <dl className={styles.segmentValues}>
                <div>
                  <dt>매출</dt>
                  <dd>{money(s.revenue)}</dd>
                </div>
                {s.operating_income !== null && (
                  <div>
                    <dt>영업이익</dt>
                    <dd>{money(s.operating_income)}</dd>
                  </div>
                )}
                {s.yoy_rate !== null && (
                  <div>
                    <dt>작년보다</dt>
                    <dd>
                      <ChangeRate rate={s.yoy_rate} />
                    </dd>
                  </div>
                )}
              </dl>
              {s.comment && <p className={styles.segmentComment}>{s.comment}</p>}
            </li>
          ))}
        </ul>
      </Block>

      <Block title="왜 이렇게 됐나요?" empty={data.reasons.length === 0}>
        <ol className={styles.reasons}>
          {data.reasons.map((r) => (
            <li key={r.title} className={styles.reason}>
              <p className={styles.reasonTitle}>{r.title}</p>
              <p className={styles.reasonText}>{r.description}</p>
              {r.evidence.length > 0 && (
                <ul className={styles.evidence} aria-label="근거">
                  {r.evidence.map((e) => (
                    <li key={`${e.label}-${e.date}`}>
                      <a
                        className={styles.chip}
                        href={e.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span className={styles.chipType}>
                          {e.type === 'disclosure' ? '공시' : '뉴스'}
                        </span>
                        {e.label} · {shortDate(e.date)}
                        <span className="visually-hidden">(새 창에서 열려요)</span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      </Block>

      <p className={styles.source}>
        {data.source ? (
          <>
            출처:{' '}
            <a href={data.source.url} target="_blank" rel="noopener noreferrer">
              DART {data.source.title} <Icon name="external" size={14} />
              <span className="visually-hidden">(새 창에서 열려요)</span>
            </a>{' '}
            · {fullDate(data.source.date)} 기준
          </>
        ) : (
          `출처: ${NO_DATA}`
        )}
      </p>
    </>
  );
}

/** 재무 상세 맨 위 "최근 사업 성과 분석". 개요의 요약을 자세히 풀어서 보여줘요. */
export function PerformanceAnalysis({ stockCode }: { stockCode: string }) {
  const { data, isPending, isError, error, refetch } = usePerformanceDetail(stockCode);
  const notFound = error instanceof ApiError && error.status === 404;

  return (
    <Section
      id={PERFORMANCE_ANCHOR}
      title={TITLE}
      description={
        data
          ? `${data.period_label} · ${fullDate(data.announced_at)} 발표 · 단위: ${data.unit}`
          : undefined
      }
    >
      {isPending ? (
        <div className={styles.skeleton} aria-hidden="true" />
      ) : isError && !notFound ? (
        <ErrorState compact error={error} onRetry={() => refetch()} />
      ) : !data ? (
        <p className={styles.muted}>{NO_DATA}</p>
      ) : (
        <Analysis data={data} />
      )}
    </Section>
  );
}
