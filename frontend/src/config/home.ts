/** 메인 화면 설정값 */

/** 검색창 아래 예시 칩. 누르면 그 기업 화면으로 가요. */
export const SEARCH_EXAMPLES = [
  { stock_code: '005930', name: '삼성전자' },
  { stock_code: '000660', name: 'SK하이닉스' },
  { stock_code: '005380', name: '현대차' },
];

/** 메인에 보여줄 거래대금 순위 개수 (전체 보기는 응답 전체) */
export const HOME_TRADING_LIMIT = 10;

/** 업종 탭마다 보여줄 기업 수 */
export const HOME_SECTOR_LIMIT = 5;

/** "떠오르는 기업"은 선정 기준이 정해질 때까지 숨겨요. VITE_FEATURE_RISING_COMPANIES=true 로 켤 수 있어요. */
export const FEATURE_RISING_COMPANIES = import.meta.env.VITE_FEATURE_RISING_COMPANIES === 'true';
