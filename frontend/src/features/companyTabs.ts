export const companyTabs = [
  { id: 'chart', label: '차트' },
  { id: 'financials', label: '재무 분석' },
] as const;

/** 기업 화면을 처음 열면 보이는 탭 */
export const DEFAULT_COMPANY_TAB: CompanyTabId = 'chart';

export type CompanyTabId = (typeof companyTabs)[number]['id'];

/** 다른 탭으로 이동. anchorId 를 주면 그 위치까지 스크롤해요. */
export type GoToTab = (tab: CompanyTabId, anchorId?: string) => void;

export const isCompanyTabId = (value: string | null): value is CompanyTabId =>
  companyTabs.some((tab) => tab.id === value);
