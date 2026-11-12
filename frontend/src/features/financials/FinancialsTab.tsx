import { useMemo, useState } from 'react';
import { ApiError } from '../../api/errors';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { HorizontalBars } from '../../components/HorizontalBars';
import { Section } from '../../components/Section';
import { TermText } from '../../components/TermText';
import { useFinancials } from '../../hooks/useFinancials';
import { formatTrillion } from '../../utils/format';
import { IndicatorSignals } from './IndicatorSignals';
import { AnnualFinancialsSection } from './AnnualFinancialsSection';
import { buildIndicators } from './indicators';
import { PerformanceAnalysis } from './PerformanceAnalysis';
import styles from './Financials.module.css';

/** 재무 상세: 맨 위 최근 사업 성과 분석 → 연간 재무·사업별 매출 → 주요 지표 → 원본 숫자 */
export function FinancialsTab({ stockCode }: { stockCode: string }) {
  return (
    <div>
      {/* 개요 [자세히 보기]로 바로 스크롤해 오도록 재무제표 로딩과 상관없이 먼저 그려요 */}
      <PerformanceAnalysis stockCode={stockCode} />
      <FinancialStatements stockCode={stockCode} />
    </div>
  );
}

function FinancialStatements({ stockCode }: { stockCode: string }) {
  const { data: financials, isPending, isError, error, refetch } = useFinancials(stockCode);
  const [showRaw, setShowRaw] = useState(true);

  const indicators = useMemo(() => (financials ? buildIndicators(financials) : []), [financials]);

  if (isPending) return <p className={styles.loading}>재무제표를 불러오고 있어요…</p>;
  if (isError && error instanceof ApiError && error.status === 404)
    return (
      <EmptyState title="자료를 찾지 못했어요" description="이 기업의 재무제표가 아직 없어요." />
    );
  if (isError || !financials)
    return (
      <ErrorState title="재무제표를 불러오지 못했어요" error={error} onRetry={() => refetch()} />
    );

  const annual = [...financials.annual].sort((a, b) => a.fiscal_year - b.fiscal_year);

  return (
    <div>
      <div className={styles.twoCol}>
        <AnnualFinancialsSection financials={financials} title="3년 동안 얼마나 벌었나요?">
          <div className={styles.quarter}>
            <p className={styles.quarterLabel}>
              {financials.latest_quarter.label} · {financials.latest_quarter.note}
            </p>
            <p className={styles.quarterValue}>
              매출 {formatTrillion(financials.latest_quarter.revenue)} · 영업이익{' '}
              {formatTrillion(financials.latest_quarter.operating_income)}
            </p>
          </div>
        </AnnualFinancialsSection>

        <Section
          title="무엇으로 돈을 버나요?"
          description={`사업별 매출 · ${financials.segments.base_label} · 단위: ${financials.unit}`}
        >
          <HorizontalBars
            data={financials.segments.items.map((s) => ({
              id: s.code,
              label: s.name,
              value: s.revenue,
            }))}
            formatValue={(v) => formatTrillion(v)}
          />
        </Section>
      </div>

      <Section
        title="주요 지표"
        description="숫자가 높은 편인지 낮은 편인지, 비교 기준과 함께 알려줘요"
      >
        <IndicatorSignals indicators={indicators} />
      </Section>

      <Section>
        <button
          type="button"
          className={styles.rawToggle}
          onClick={() => setShowRaw((v) => !v)}
          aria-expanded={showRaw}
          aria-controls="raw-financials"
        >
          재무제표 원본 숫자 보기
          <span
            className={`${styles.chevron} ${showRaw ? styles.chevronOpen : ''}`}
            aria-hidden="true"
          >
            ⌄
          </span>
        </button>
        {showRaw && (
          <div id="raw-financials" className={styles.rawWrap}>
            <table className={styles.table}>
              <caption className="visually-hidden">재무제표 원본 숫자</caption>
              <thead>
                <tr>
                  <th scope="col">기간</th>
                  <th scope="col">
                    <TermText text="매출액" />
                  </th>
                  <th scope="col">
                    <TermText text="영업이익" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {annual.map((row) => (
                  <tr key={row.fiscal_year}>
                    <th scope="row">{row.fiscal_year}년</th>
                    <td>{formatTrillion(row.revenue)}</td>
                    <td>{formatTrillion(row.operating_income)}</td>
                  </tr>
                ))}
                <tr>
                  <th scope="row">{financials.latest_quarter.label}</th>
                  <td>{formatTrillion(financials.latest_quarter.revenue)}</td>
                  <td>{formatTrillion(financials.latest_quarter.operating_income)}</td>
                </tr>
              </tbody>
            </table>
            <p className={styles.caption}>
              {financials.basis} · 출처: {financials.source}
            </p>
          </div>
        )}
      </Section>
    </div>
  );
}
