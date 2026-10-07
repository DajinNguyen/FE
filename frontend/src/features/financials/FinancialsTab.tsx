import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { HorizontalBars } from '../../components/HorizontalBars';
import { Section } from '../../components/Section';
import { TermText } from '../../components/TermText';
import { useFinancials } from '../../hooks/useFinancials';
import { formatTrillion } from '../../utils/format';
import { IndicatorSignals } from './IndicatorSignals';
import { AnnualFinancialsSection } from './AnnualFinancialsSection';
import { buildIndicators } from './indicators';
import styles from './Financials.module.css';

export function FinancialsTab({ stockCode }: { stockCode: string }) {
  const { data: financials, isPending, isError } = useFinancials(stockCode);
  const [showRaw, setShowRaw] = useState(true);

  const indicators = useMemo(() => (financials ? buildIndicators(financials) : []), [financials]);

  if (isPending) return <p className={styles.loading}>재무제표를 불러오고 있어요…</p>;
  if (isError || !financials)
    return (
      <EmptyState
        title="자료를 찾지 못했어요"
        description="이 기업의 재무제표를 아직 불러오지 못했어요."
      />
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

      <Section title="지표 신호등" description="숫자가 어느 정도인지 신호등 색으로 알려줘요">
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
