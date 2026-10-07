/** GET /api/companies/{stock_code}/news 응답 항목 */
export interface NewsItem {
  id: string;
  title: string;
  url: string | null;
  source: string;
  published_at: string;
  summary: string;
  /** 이 소식과 연결되는 재무 숫자 */
  financial_link: { label: string; value: string } | null;
  /** 실제 기사로 교체 예정인 자리 */
  is_placeholder: boolean;
}
