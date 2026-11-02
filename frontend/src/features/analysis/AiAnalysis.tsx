import { Button } from '../../components/Button';
import { DataAsOf } from '../../components/DataAsOf';
import { Icon } from '../../components/Icon';
import { TermText } from '../../components/TermText';
import type { CompanyReportFlow } from '../../hooks/useCompanyReport';
import type { CompanyReport, EvidenceKind, KeyPoint } from '../../types';
import { useState } from 'react';
import { KeyPointRow } from './KeyPointRow';
import { KeyPointSheet } from './KeyPointSheet';
import { QuotaNotice } from './QuotaNotice';
import { RegenerateProgress, ReportSkeleton, ReportWaiting } from './ReportWaiting';
import { groupKeyPoints } from './reportMeta';
import styles from './AiAnalysis.module.css';

interface AiAnalysisProps {
  flow: CompanyReportFlow;
  onEvidence: (kind: EvidenceKind) => void;
}

/** "재무 2025년 사업보고서 · 주가 10월 5일 · 뉴스 1월 29일" (없는 항목은 빼요) */
const dataAsOfItems = (report: CompanyReport) => {
  const asOf = report.data_as_of;
  if (!asOf) return [];
  return [
    { label: '재무', value: asOf.financials },
    { label: '주가', value: asOf.price },
    { label: '뉴스', value: asOf.news },
  ];
};

const formatGeneratedAt = (value: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

/** 기업 화면에서 가장 먼저, 가장 크게 보이는 AI 핵심 분석 */
export function AiAnalysis({ flow, onEvidence }: AiAnalysisProps) {
  const { view, report, isRegenerating, startedAt, failureReason, generate, cancel, quota } = flow;
  const blocked = quota.blocked !== null;
  const [openPoint, setOpenPoint] = useState<KeyPoint | null>(null);

  return (
    <section className={styles.analysis} aria-labelledby="ai-analysis-title">
      <div className={styles.body}>
        <p id="ai-analysis-title" className={styles.eyebrow}>
          AI 핵심 분석
        </p>

        {view === 'checking' && <ReportSkeleton />}

        {view === 'none' && (
          <div className={styles.emptyCard}>
            <p className={styles.emptyTitle}>아직 이 기업의 리포트가 없어요</p>
            <p className={styles.emptyText}>
              AI가 재무제표·뉴스·기업 비전을 읽고 어떤 회사인지, 지금 어떤 상황인지, 왜 그런지를
              핵심 포인트 5가지로 정리해 드려요. 보통 15초 정도 걸려요.
            </p>
            <div className={styles.actionRow}>
              <Button size="lg" onClick={generate} disabled={blocked}>
                AI 리포트 만들기
              </Button>
              <QuotaNotice quota={quota} />
            </div>
          </div>
        )}

        {view === 'generating' && !report && (
          <ReportWaiting startedAt={startedAt} onCancel={cancel} />
        )}

        {view === 'failed' && (
          <div className={styles.emptyCard} role="alert">
            <p className={styles.emptyTitle}>리포트를 만들지 못했어요</p>
            <p className={styles.emptyText}>{failureReason}</p>
            <div className={styles.actionRow}>
              <Button size="lg" onClick={generate} disabled={blocked}>
                <Icon name="refresh" size={18} /> 다시 시도
              </Button>
              <QuotaNotice quota={quota} />
            </div>
          </div>
        )}

        {report && (view === 'done' || view === 'generating') && (
          <>
            {isRegenerating && <RegenerateProgress startedAt={startedAt} onCancel={cancel} />}
            <h2 className={styles.headline}>
              <TermText text={report.headline} />
            </h2>
            <div className={styles.groups}>
              {groupKeyPoints(report.key_points).map((group) => (
                <section key={group.id} aria-labelledby={`kp-${group.id}`}>
                  <h3 id={`kp-${group.id}`} className={styles.groupTitle}>
                    {group.title}
                  </h3>
                  <ul className={styles.points}>
                    {group.points.map((point, index) => (
                      <KeyPointRow
                        key={`${point.category}-${index}`}
                        point={point}
                        onOpen={setOpenPoint}
                      />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
            <p className={styles.asOf}>
              <DataAsOf
                items={dataAsOfItems(report)}
                prefix="이 리포트는"
                suffix="기준 자료로 만들었어요."
              />{' '}
              {formatGeneratedAt(report.generated_at)} 생성 · 항목을 누르면 이유·연도별 숫자·근거를
              볼 수 있어요
            </p>
            <div className={styles.footer}>
              <span>
                숫자는 공식 자료, 문장은 AI가 썼어요. 교육용 정보이며 투자 추천이 아니에요.
              </span>
              <div className={styles.regenerateRow}>
                <QuotaNotice quota={quota} />
                <button
                  type="button"
                  className={styles.regenerate}
                  onClick={generate}
                  disabled={isRegenerating || blocked}
                >
                  <Icon name="refresh" size={14} /> 다시 만들기
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      <KeyPointSheet point={openPoint} onClose={() => setOpenPoint(null)} onEvidence={onEvidence} />
    </section>
  );
}
