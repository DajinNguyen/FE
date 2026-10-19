import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { TermText } from '../../components/TermText';
import type { CompanyReportFlow } from '../../hooks/useCompanyReport';
import type { CompanyReport, EvidenceKind } from '../../types';
import { formatMarketDate } from '../../utils/format';
import { KeyPointCard } from './KeyPointCard';
import { ReportProgress } from './ReportProgress';
import { keyPointOrder, sortKeyPoints } from './reportMeta';
import styles from './AiAnalysis.module.css';

interface AiAnalysisProps {
  flow: CompanyReportFlow;
  onEvidence: (kind: EvidenceKind) => void;
}

/** "재무 2025년 사업보고서 · 주가 10월 5일 · 뉴스 1월 29일" (없는 항목은 빼요) */
const describeDataAsOf = (report: CompanyReport) => {
  const asOf = report.data_as_of;
  if (!asOf) return '';
  return [
    asOf.financials && `재무 ${asOf.financials}`,
    asOf.price && `주가 ${formatMarketDate(asOf.price)}`,
    asOf.news && `뉴스 ${formatMarketDate(asOf.news)}`,
  ]
    .filter(Boolean)
    .join(' · ');
};

const formatGeneratedAt = (value: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

/** 기업 화면에서 가장 먼저, 가장 크게 보이는 AI 핵심 분석 */
export function AiAnalysis({ flow, onEvidence }: AiAnalysisProps) {
  const { view, report, isRegenerating, startedAt, failureReason, generate, cancel } = flow;

  return (
    <section className={styles.analysis} aria-labelledby="ai-analysis-title">
      <div className={styles.body}>
        <p id="ai-analysis-title" className={styles.eyebrow}>
          AI 핵심 분석
        </p>

        {view === 'checking' && <AnalysisSkeleton />}

        {view === 'none' && (
          <div className={styles.emptyCard}>
            <p className={styles.emptyTitle}>아직 이 기업의 리포트가 없어요</p>
            <p className={styles.emptyText}>
              재무제표·뉴스·기업 비전을 함께 읽고, 핵심 포인트 5가지로 쉽게 정리해 드려요.
            </p>
            <Button size="lg" onClick={generate}>
              AI 리포트 만들기
            </Button>
          </div>
        )}

        {view === 'generating' && !report && (
          <>
            <ReportProgress startedAt={startedAt} onCancel={cancel} />
            <AnalysisSkeleton />
          </>
        )}

        {view === 'failed' && (
          <div className={styles.emptyCard} role="alert">
            <p className={styles.emptyTitle}>리포트를 만들지 못했어요</p>
            <p className={styles.emptyText}>{failureReason}</p>
            <Button size="lg" onClick={generate}>
              <Icon name="refresh" size={18} /> 다시 시도
            </Button>
          </div>
        )}

        {report && (view === 'done' || view === 'generating') && (
          <>
            {isRegenerating && <ReportProgress startedAt={startedAt} onCancel={cancel} compact />}
            <h2 className={styles.headline}>
              <TermText text={report.headline} />
            </h2>
            <p className={styles.asOf}>
              {describeDataAsOf(report)
                ? `이 리포트는 ${describeDataAsOf(report)} 기준 자료로 만들었어요. `
                : ''}
              {formatGeneratedAt(report.generated_at)} 생성
            </p>
            <ol className={styles.points} aria-label="핵심 포인트">
              {sortKeyPoints(report.key_points).map((point, index) => (
                <KeyPointCard
                  key={`${point.category}-${index}`}
                  point={point}
                  index={index}
                  onEvidence={onEvidence}
                />
              ))}
            </ol>
            <div className={styles.footer}>
              <span>
                숫자는 공식 자료, 문장은 AI가 썼어요. 교육용 정보이며 투자 추천이 아니에요.
              </span>
              <button
                type="button"
                className={styles.regenerate}
                onClick={generate}
                disabled={isRegenerating}
              >
                <Icon name="refresh" size={14} /> 다시 만들기
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/** 처음 만들 때 보여주는 핵심 분석 모양의 빈 카드 */
function AnalysisSkeleton() {
  return (
    <div className={styles.skeleton} aria-hidden="true">
      <div className={`${styles.skeletonLine} ${styles.skeletonHeadline}`} />
      {keyPointOrder.map((category) => (
        <div key={category} className={styles.skeletonCard}>
          <div className={`${styles.skeletonLine} ${styles.skeletonShort}`} />
          <div className={styles.skeletonLine} />
        </div>
      ))}
    </div>
  );
}
