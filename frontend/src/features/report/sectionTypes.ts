import type { CompanyReport } from '../../types';
import type { GoToTab } from '../companyTabs';

export interface ReportSectionProps {
  report: CompanyReport;
  onGoToTab: GoToTab;
}
