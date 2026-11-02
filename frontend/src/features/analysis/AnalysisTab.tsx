import { Section } from '../../components/Section';
import type { CompanyReportFlow } from '../../hooks/useCompanyReport';
import type { EvidenceKind } from '../../types';
import { AiAnalysis } from './AiAnalysis';
import { evidenceAnchorId, evidenceDetailTab } from './reportMeta';
import type { GoToTab } from '../companyTabs';
import { EvidenceSection } from '../evidence/EvidenceSection';
import { Quiz } from '../quiz/Quiz';
import { CoreChart } from '../overview/CoreChart';

export const QUIZ_ANCHOR_ID = 'company-quiz';

interface AnalysisTabProps {
  flow: CompanyReportFlow;
  onGoToTab: GoToTab;
}

/** AI 분석 탭. 순서: AI 핵심 분석 → 핵심 그래프 → 근거 자료 → 기업 퀴즈 */
export function AnalysisTab({ flow, onGoToTab }: AnalysisTabProps) {
  const { report } = flow;

  const goToEvidence = (kind: EvidenceKind) => {
    const hasData =
      kind === 'news' ? (report?.evidence.news.length ?? 0) > 0 : Boolean(report?.evidence[kind]);
    if (!hasData) {
      onGoToTab(evidenceDetailTab[kind]);
      return;
    }
    const target = document.getElementById(evidenceAnchorId(kind));
    target?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    target?.focus({ preventScroll: true });
  };

  return (
    <div>
      <AiAnalysis flow={flow} onEvidence={goToEvidence} />
      {report && (
        <>
          <CoreChart financials={report.evidence.financials} onGoToTab={onGoToTab} />
          <EvidenceSection evidence={report.evidence} onGoToTab={onGoToTab} />
          {report.quiz.length > 0 && (
            <Section
              id={QUIZ_ANCHOR_ID}
              title="기업 퀴즈"
              description="위 분석에 나온 숫자로만 냈어요"
            >
              <Quiz questions={report.quiz} />
            </Section>
          )}
        </>
      )}
    </div>
  );
}
