import type { CompanyReportFlow } from '../../hooks/useCompanyReport';
import type { EvidenceKind } from '../../types';
import { AiAnalysis } from './AiAnalysis';
import { evidenceDetailTab } from './reportMeta';
import type { GoToTab } from '../companyTabs';

interface AnalysisTabProps {
  flow: CompanyReportFlow;
  onGoToTab: GoToTab;
}

/**
 * AI 분석 탭: AI 핵심 분석만 보여줘요.
 * 근거 숫자·뉴스는 재무 상세·뉴스 상세 탭에 있어서, 근거 칩을 누르면 그 탭으로 가요.
 */
export function AnalysisTab({ flow, onGoToTab }: AnalysisTabProps) {
  const goToEvidence = (kind: EvidenceKind) => onGoToTab(evidenceDetailTab[kind]);
  return <AiAnalysis flow={flow} onEvidence={goToEvidence} />;
}
