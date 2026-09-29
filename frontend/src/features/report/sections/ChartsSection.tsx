import { Section } from '../../../components/Section';
import { TermText } from '../../../components/TermText';
import { useFinancials } from '../../../hooks/useFinancials';
import { chartBasis, getChartRenderer } from '../charts/reportChartRegistry';
import type { ReportSectionProps } from '../sectionTypes';
import styles from './ReportSections.module.css';

/** 그래프로 보면: 숫자는 공식 재무 데이터로 그리고, AI는 설명만 붙여요. */
export function ChartsSection({ report }: ReportSectionProps) {
  const { data: financials } = useFinancials(report.stock_code);
  const charts = report.charts
    .map((chart) => ({ chart, Renderer: getChartRenderer(chart.type) }))
    .filter((item) => item.Renderer !== null);

  if (charts.length === 0) return null;

  return (
    <Section title="그래프로 보면" description="숫자는 공식 자료 그대로, 설명은 AI가 썼어요">
      <ul className={styles.grid2}>
        {charts.map(({ chart, Renderer }) => (
          <li key={chart.id} className={styles.chartCard}>
            <h3 className={styles.chartTitle}>{chart.title}</h3>
            <div className={styles.chartBody}>
              {financials && Renderer ? (
                <Renderer financials={financials} />
              ) : (
                <div className={styles.chartSkeleton} aria-hidden="true" />
              )}
            </div>
            <p className={styles.chartCaption}>
              <span className={styles.aiTag}>AI 설명</span>
              <TermText text={chart.caption} />
            </p>
            {financials && <p className={styles.source}>{chartBasis(chart, financials)}</p>}
          </li>
        ))}
      </ul>
    </Section>
  );
}
