/** 메인 화면 설정값 */

/** 메인 "기업 둘러보기"에 보여줄 거래대금 순위 개수 (전체 보기는 응답 전체) */
export const HOME_TRADING_LIMIT = 5;

/** 업종 탭마다 보여줄 기업 수 */
export const HOME_SECTOR_LIMIT = 5;

/** "떠오르는 기업"은 선정 기준이 정해질 때까지 숨겨요. VITE_FEATURE_RISING_COMPANIES=true 로 켤 수 있어요. */
export const FEATURE_RISING_COMPANIES = import.meta.env.VITE_FEATURE_RISING_COMPANIES === 'true';
