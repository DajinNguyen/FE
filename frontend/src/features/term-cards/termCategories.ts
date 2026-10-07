import type { TermCategory, TermLevel } from '../../types';

export const termCategoryLabels: Record<TermCategory, string> = {
  basic: '기초',
  financial_statement: '재무제표',
  indicator: '투자 지표',
  market: '시장',
  industry: '산업',
};

export const termCategories = Object.keys(termCategoryLabels) as TermCategory[];

export const termLevelLabels: Record<TermLevel, string> = {
  beginner: '초급',
  intermediate: '중급',
};

export type TermCategoryFilter = TermCategory | 'all';
