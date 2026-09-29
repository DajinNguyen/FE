import type { Status } from './common';

export interface KeyPoint {
  id: string;
  category: 'performance' | 'vision' | 'news';
  title: string;
  body: string;
  status: Status;
  source: string;
  base_date: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  answer_index: number;
  explanation: string;
}

/**
 * 리포트에 넣을 그래프. 그래프의 숫자는 재무 데이터(Financials)에서 가져오고,
 * AI는 어떤 그래프를 넣을지와 설명(caption)만 정해요.
 * 프론트가 모르는 type 은 건너뛰어서, 백엔드가 새 그래프를 먼저 추가해도 화면이 깨지지 않아요.
 */
export type ReportChartType =
  'annual_revenue' | 'annual_operating_income' | 'operating_margin' | 'segment_revenue';

export interface ReportChart {
  id: string;
  type: ReportChartType | (string & {});
  title: string;
  caption: string;
}

/**
 * GET  /api/companies/{stock_code}/report → 저장된 리포트 (없으면 404)
 * POST /api/companies/{stock_code}/report → 새로 생성한 리포트
 */
export interface CompanyReport {
  stock_code: string;
  generated_at: string;
  generation_seconds: number;
  /** 서버에 저장된 리포트를 바로 돌려준 경우 true */
  is_cached: boolean;
  analyzed_sources: string[];
  summary: string;
  key_points: KeyPoint[];
  charts: ReportChart[];
  connection: {
    chain: string[];
    conclusion: string;
  };
  strengths: string[];
  watch_points: string[];
  quiz: QuizQuestion[];
  disclaimers: string[];
  data_sources: string[];
}
