import type { SampleNumber } from './common';
import type { CompanySummary, SectorGroup } from './company';

/** 오늘 거래가 많은 기업 항목 */
export interface TradingCompany extends CompanySummary {
  /** 거래대금 (억 원) */
  trading_value: SampleNumber;
  /** 이 기업 AI 리포트의 한 줄 결론. 리포트가 없으면 null (화면에서 그 줄을 숨겨요) */
  ai_headline: string | null;
}

export interface CompanyRanking {
  /** 이 목록을 어떤 기준으로 뽑았는지 (화면에 그대로 보여줘요) */
  criteria: string;
  items: CompanySummary[];
}

/** AI가 분석한 기업 카드 */
export interface AnalyzedCompany {
  stock_code: string;
  name: string;
  headline: string;
  generated_at: string;
}

/** GET /api/home 응답 (백엔드 결정 대기: 떠오르는·관심도 기준) */
export interface HomeDashboard {
  /** 거래대금 기준 시각. 보통 직전 거래일 장 마감 (예: "2026-10-16 15:30") */
  base_time: string;
  /** 거래대금 순위 최대 30개. 메인은 앞 10개, 전체 보기(/rankings/trading)는 30개를 보여줘요. */
  trading_value_top: TradingCompany[];
  /** 업종 탭별 기업. 탭 이름·순서는 프론트 상수에서 가져와요. 빈 배열이면 "아직 없어요" 안내 */
  sector_companies: Record<SectorGroup, CompanySummary[]>;
  /** 화면에서 쓰지 않아요 (떠오르는 기업 삭제) */
  rising: CompanyRanking;
  /** 메인 재구성 후 화면에서 쓰지 않아요. (백엔드는 계속 보내도 돼요) */
  most_viewed: CompanyRanking;
  /** 메인 재구성 후 화면에서 쓰지 않아요. 한 줄 결론은 trading_value_top[].ai_headline 으로 옮겼어요. */
  ai_analyzed: AnalyzedCompany[];
}
