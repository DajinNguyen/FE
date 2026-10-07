/** 개요는 초보자용 기본 화면, 나머지는 자세한 데이터를 보는 상세 화면이에요. */
export const companyTabs = [
  { id: 'overview', label: '개요' },
  { id: 'financials', label: '재무 상세' },
  { id: 'news', label: '뉴스 상세' },
  { id: 'info', label: '기업 정보' },
  { id: 'community', label: '커뮤니티' },
] as const;

/** 기업 화면을 처음 열면 보이는 탭 */
export const DEFAULT_COMPANY_TAB: CompanyTabId = 'overview';

export type CompanyTabId = (typeof companyTabs)[number]['id'];

/** 다른 탭으로 이동. anchorId 를 주면 그 위치까지 스크롤해요. */
export type GoToTab = (tab: CompanyTabId, anchorId?: string) => void;

export const isCompanyTabId = (value: string | null): value is CompanyTabId =>
  companyTabs.some((tab) => tab.id === value);
