import type { EvidenceKind, KeyPoint, KeyPointCategory } from '../../types';
import type { CompanyTabId } from '../companyTabs';

/** 핵심 포인트는 항상 이 순서로 보여줘요. */
export const keyPointOrder: KeyPointCategory[] = [
  'performance',
  'revenue_source',
  'recent_change',
  'risk',
  'strength',
];

export const keyPointLabel: Record<KeyPointCategory, string> = {
  performance: '실적 특징',
  revenue_source: '주요 수익원',
  recent_change: '최근 실적 변화',
  risk: '위험·변화 요인',
  strength: '핵심 경쟁력',
};

export const evidenceLabel: Record<EvidenceKind, string> = {
  financials: '재무제표',
  news: '뉴스',
  vision: '기업 비전',
};

/** 개요 화면 안의 근거 자료 위치 */
export const evidenceAnchorId = (kind: EvidenceKind) => `evidence-${kind}`;

/** 근거 자료가 없을 때 대신 보여줄 상세 탭 */
export const evidenceDetailTab: Record<EvidenceKind, CompanyTabId> = {
  financials: 'financials',
  news: 'news',
  vision: 'info',
};

/** 백엔드가 순서를 다르게 보내도 정해진 순서로 정렬해요. 모르는 분류는 뒤로 보내요. */
export function sortKeyPoints(points: KeyPoint[]) {
  const rank = (p: KeyPoint) => {
    const i = keyPointOrder.indexOf(p.category);
    return i === -1 ? keyPointOrder.length : i;
  };
  return [...points].sort((a, b) => rank(a) - rank(b));
}
