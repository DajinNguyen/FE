import type { CompanySummary } from '../types';

/** 상장 시장 이름 (OpenDART 상장사 전체: 코스피·코스닥·코넥스) */
export const MARKET_LABELS: Record<CompanySummary['market'], string> = {
  KOSPI: '코스피',
  KOSDAQ: '코스닥',
  KONEX: '코넥스',
};
