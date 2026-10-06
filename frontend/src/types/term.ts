/** GET /api/terms 응답 항목 */
export interface Term {
  id: string;
  name: string;
  /** 본문에서 이 용어로 인식할 표현들 (긴 것부터 매칭) */
  aliases: string[];
  easy_meaning: string;
  example: string;
}
