/** 용어 분류: 기초 / 재무제표 / 투자 지표 / 시장 / 산업 */
export type TermCategory = 'basic' | 'financial_statement' | 'indicator' | 'market' | 'industry';

/** 난이도: 초급 / 중급 */
export type TermLevel = 'beginner' | 'intermediate';

/** GET /api/terms 응답 항목 */
export interface Term {
  id: string;
  /** 용어 이름 */
  term: string;
  /** 본문에서 이 용어로 인식할 표현들 (긴 것부터 매칭) */
  aliases: string[];
  category: TermCategory;
  level: TermLevel;
  /** 쉬운 뜻 */
  easy: string;
  example: string;
}
