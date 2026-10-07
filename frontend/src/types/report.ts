/**
 * AI 리포트 응답 형식 (docs/report-schema-proposal.md 제안안, 백엔드·AI 합의 전).
 * 숫자(before/after, evidence)는 백엔드가 공식 자료로 계산해서 넣고,
 * AI는 문장(headline, title, reason, meaning)만 써요.
 *
 * GET  /api/companies/{stock_code}/report → 마지막으로 성공한 리포트 내용 + 지금 상태
 *      (한 번도 만든 적 없으면 status: "none", 다시 만드는 중·실패여도 이전 내용은 그대로)
 * POST /api/companies/{stock_code}/report → 새로 만들기 시작 (status: "generating" 또는 바로 "done")
 */

/** none: 아직 없음 / generating: 만드는 중 / done: 완료 / failed: 실패 */
export type ReportStatus = 'none' | 'generating' | 'done' | 'failed';

/** 핵심 포인트 5가지. 항상 이 순서로 보여줘요. */
export type KeyPointCategory =
  'performance' | 'revenue_source' | 'recent_change' | 'risk' | 'strength';

/** 근거 자료 종류 */
export type EvidenceKind = 'financials' | 'news' | 'vision';

export interface KeyPointValue {
  label: string;
  value: string;
  period: string;
}

export interface KeyPoint {
  category: KeyPointCategory;
  /** 한 줄 결론 */
  title: string;
  /** 과거 값. 비교할 숫자가 없으면 null */
  before: KeyPointValue | null;
  /** 현재 값. 비교할 숫자가 없으면 null */
  after: KeyPointValue | null;
  /** 왜 그런가요? (1~2문장) */
  reason: string;
  /** 무슨 뜻인가요? (초보자용 해석 1문장) */
  meaning: string;
  evidence: EvidenceKind[];
}

export interface FinancialHighlight {
  label: string;
  value: string;
  source: string;
  /** (추가 제안) 아직 공식 자료로 확인하지 않은 값이면 true → "예시 값" 배지 */
  is_sample?: boolean;
}

export interface FinancialsEvidence {
  unit: string;
  /** years[i] 와 revenue[i], operating_income[i] 가 같은 해예요. */
  years: string[];
  revenue: number[];
  operating_income: number[];
  highlights: FinancialHighlight[];
  /** (추가 제안) 기준일 예: "2025년 연간 · 연결 기준" */
  base_date?: string;
}

export interface NewsEvidence {
  title: string;
  press: string;
  published_at: string;
  summary: string;
  url: string;
}

export interface RevenueMixItem {
  name: string;
  amount: number;
  unit: string;
  period: string;
}

export interface VisionEvidence {
  summary: string;
  revenue_mix: RevenueMixItem[];
  source: string;
  /** (추가 제안) 기준일 예: "2026년 1월" */
  base_date?: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer_index: number;
  explanation: string;
}

export interface CompanyReport {
  stock_code: string;
  status: ReportStatus;
  generated_at: string | null;
  /** AI 한 줄 결론 */
  headline: string;
  key_points: KeyPoint[];
  evidence: {
    financials: FinancialsEvidence | null;
    news: NewsEvidence[];
    vision: VisionEvidence | null;
  };
  quiz: QuizQuestion[];
  sources: string[];
  /** (추가 제안) status 가 failed 일 때 사용자에게 보여줄 원인 */
  failure_reason?: string | null;
}
