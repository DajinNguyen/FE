/**
 * GET /api/companies/{stock_code}/performance 응답 — 재무 상세 "최근 사업 성과 분석".
 * 블록마다 자료가 없을 수 있어요. 없는 블록은 null(또는 빈 배열)로 보내면 그 블록만 "자료가 없어요"로 보여요.
 */
export interface PerformanceDetail {
  /** 예: "2025년 4분기" */
  period_label: string;
  /** 실적 발표일 (YYYY-MM-DD) */
  announced_at: string;
  /** 금액 단위. 예: "조 원" */
  unit: string;
  /** 실적 요약. 영업이익률은 % */
  summary: { revenue: number; operating_income: number; operating_margin: number } | null;
  /** 작년 같은 분기 대비 변화율 (%) */
  yoy: PerformanceChange | null;
  /** 전 분기 대비 변화율 (%) */
  qoq: PerformanceChange | null;
  /** 최근 분기 흐름 (오래된 분기 → 최근 분기, 최대 8개) */
  quarterly: QuarterPerformance[];
  segments: SegmentPerformance[];
  /** 왜 이렇게 됐나요? (2~3개) */
  reasons: PerformanceReason[];
  /** DART 공시 출처 */
  source: { title: string; date: string; url: string } | null;
}

export interface PerformanceChange {
  revenue_rate: number | null;
  operating_income_rate: number | null;
}

export interface QuarterPerformance {
  /** 예: "24.1Q" */
  quarter: string;
  revenue: number;
  operating_income: number;
  /** 영업이익률 (%) */
  operating_margin: number;
}

export interface SegmentPerformance {
  name: string;
  revenue: number;
  /** 사업별 영업이익을 공개하지 않으면 null (그때는 매출만 보여요) */
  operating_income: number | null;
  /** 작년 같은 분기 대비 매출 변화율 (%) */
  yoy_rate: number | null;
  /** 한 줄 설명 (예측·투자 권유 금지) */
  comment: string;
}

export interface PerformanceReason {
  title: string;
  description: string;
  evidence: {
    type: 'disclosure' | 'news';
    label: string;
    /** YYYY-MM-DD */
    date: string;
    url: string;
  }[];
}
