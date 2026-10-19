import type {
  EvidenceKind,
  EvidenceRef,
  KeyPoint,
  KeyPointCategory,
  KeyPointValue,
} from '../../types';
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

/** 근거 칩 글자: "뉴스 10.15" / 날짜가 YYYY-MM-DD 가 아니면 그대로 붙여요. */
export function evidenceChipText(ref: EvidenceRef) {
  if (!ref.date) return ref.label;
  const match = /^\d{4}-(\d{2})-(\d{2})/.exec(ref.date);
  return `${ref.label} ${match ? `${match[1]}.${match[2]}` : ref.date}`;
}

/** "6.57조 원" → { amount: 6.57, unit: "조 원" }. 숫자로 읽을 수 없으면 null */
function parseAmount(value: string) {
  const match = /^\s*(-?[\d,]+(?:\.\d+)?)\s*(.*)$/.exec(value);
  if (!match) return null;
  const amount = Number(match[1].replaceAll(',', ''));
  return Number.isFinite(amount) ? { amount, unit: match[2].trim() } : null;
}

/**
 * 과거 → 현재 값의 변화 방향과 크기. 단위가 같고 숫자로 읽을 수 있을 때만 계산해요.
 * 2배 이상이면 "6.6배", 아니면 "+33%" 처럼 보여줘요.
 */
export function describeChange(before: KeyPointValue | null, after: KeyPointValue | null) {
  if (!before || !after || before.label !== after.label) return null;
  const a = parseAmount(before.value);
  const b = parseAmount(after.value);
  if (!a || !b || a.unit !== b.unit || a.amount <= 0) return null;
  const ratio = b.amount / a.amount;
  if (ratio === 1) return { direction: 'flat' as const, text: '변화 없음' };
  const direction = ratio > 1 ? ('up' as const) : ('down' as const);
  const text =
    ratio >= 2
      ? `${ratio.toFixed(1)}배`
      : `${ratio > 1 ? '+' : ''}${Math.round((ratio - 1) * 100)}%`;
  return { direction, text };
}
