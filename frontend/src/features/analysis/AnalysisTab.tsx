import { Section } from '../../components/Section';
import type { CompanyReportFlow } from '../../hooks/useCompanyReport';
import type { EvidenceKind } from '../../types';
import { AiAnalysis } from './AiAnalysis';
import { evidenceDetailTab } from './reportMeta';
import type { GoToTab } from '../companyTabs';
import { Quiz } from '../quiz/Quiz';

export const QUIZ_ANCHOR_ID = 'company-quiz';

interface AnalysisTabProps {
  flow: CompanyReportFlow;
  onGoToTab: GoToTab;
}

/**
 * AI 분석 탭. 순서: AI 핵심 분석 → 기업 퀴즈
 * 근거 숫자·뉴스는 재무 상세·뉴스 상세 탭에 있어서, 근거 칩을 누르면 그 탭으로 가요.
 */
export function AnalysisTab({ flow, onGoToTab }: AnalysisTabProps) {
  const { report } = flow;
  const goToEvidence = (kind: EvidenceKind) => onGoToTab(evidenceDetailTab[kind]);

  return (
    <div>
      <AiAnalysis flow={flow} onEvidence={goToEvidence} />
      {report && report.quiz.length > 0 && (
        <Section id={QUIZ_ANCHOR_ID} title="기업 퀴즈" description="위 분석에 나온 숫자로만 냈어요">
          <Quiz questions={report.quiz} />
        </Section>
      )}
    </div>
  );
}
