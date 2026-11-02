/** 관심도 3단계. 메인 산업 아이콘 크기(크게·중간·작게)를 정해요. */
export type HeatLevel = 'high' | 'mid' | 'low';

/** 뜨는 산업을 고르는 기간 */
export type HeatPeriod = '1w' | '1m';

/** GET /api/industries/hot?period=1w 응답 항목: 메인 "지금 관심이 몰리는 산업" */
export interface IndustrySummary {
  industry_id: string;
  name: string;
  /** 아이콘 이름. 화면의 아이콘 매핑은 src/config/industryIcons.ts */
  icon_key: string;
  /** 관심도 점수 (계산 방법: src/config/industryHeat.ts) */
  heat_score: number;
  heat_level: HeatLevel;
  /** 아이콘 아래 대표 숫자. 예: { label: "최근 1주", value: 6.2, unit: "%" } → "최근 1주 +6.2%" */
  headline_metric: { label: string; value: number; unit: string };
  /** 기준 시각 (ISO 8601) */
  as_of: string;
  /** 예시 값이면 true → "예시 값" 배지 */
  is_sample?: boolean;
}
