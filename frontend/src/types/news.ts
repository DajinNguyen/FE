/**
 * 뉴스 한 건. 기업 뉴스·시장 뉴스·리포트 근거 뉴스가 모두 이 형식이에요.
 * 기사 전문은 받지 않아요. (요약과 원문 링크만)
 */
export interface NewsItem {
  id: string;
  title: string;
  /** 언론사 */
  press: string;
  /** 보도 시각 (ISO 8601, 예: "2026-10-24T09:30:00+09:00") */
  published_at: string;
  /** 원문 주소 (새 탭으로 열어요) */
  url: string;
  /** 한 줄 요약 (목록에 보여줘요) */
  summary_short: string;
  /** 조금 긴 요약. 없으면 null */
  summary_long: string | null;
  /** 특정 기업 기사면 종목코드, 시장 전체 기사면 null */
  company_stock_code: string | null;
  /** 이 기사와 연결되는 숫자 (예: { label: "2025년 매출", value: "333.6조 원" }). 없으면 null */
  related_metric: { label: string; value: string } | null;
}

/** GET /api/companies/{stock_code}/news?page=&size= 응답 */
export interface NewsPage {
  items: NewsItem[];
  page: number;
  size: number;
  /** 다음 페이지가 있으면 true ([더 보기] 버튼) */
  has_next: boolean;
}
