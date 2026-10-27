import { Button } from '../../components/Button';
import { Section } from '../../components/Section';
import { CompanyInfo } from '../company-info/CompanyInfo';
import type { GoToTab } from '../companyTabs';

interface OverviewTabProps {
  stockCode: string;
  onGoToTab: GoToTab;
}

/** 검색하고 들어오면 처음 보이는 탭. 무슨 회사인지 → AI 분석 보기 */
export function OverviewTab({ stockCode, onGoToTab }: OverviewTabProps) {
  return (
    <div>
      <CompanyInfo stockCode={stockCode} />
      <Section>
        <Button size="lg" onClick={() => onGoToTab('analysis')}>
          AI 분석 보기
        </Button>
      </Section>
    </div>
  );
}
