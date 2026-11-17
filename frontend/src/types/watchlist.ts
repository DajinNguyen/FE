/** 관심 기업 — GET·PUT /api/me/watchlist (보낸 순서 그대로, 같은 회사는 한 번만) */
export interface Watchlist {
  stock_codes: string[];
}
