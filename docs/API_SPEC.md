# 다진 API 명세 (프론트 기준)

| 항목 | 내용 |
|---|---|
| 작성 | 프론트엔드 (노현승) · 2026-10-07 |
| 대상 | 백엔드, AI·리포트 엔진 |
| 상태 | **프론트 기본안.** 프론트는 이 형식의 목 데이터로 화면을 완성했어요. 바꿀 점은 PR 코멘트로 알려 주세요 |
| 타입 원본 | `frontend/src/types/*.ts` (이 문서와 다르면 타입 파일이 기준) |
| 예시 데이터 | `frontend/src/mocks/*.json`, `frontend/src/mocks/mockServer.ts` |

## 0. 진행 방식

1. 프론트가 목 데이터로 화면과 API 형식을 먼저 만들어 PR을 올려요.
2. 백엔드가 리뷰·코멘트 후 승인하고 머지해요.
3. 백엔드가 main을 받아서 이 문서대로 API를 구현해요.
4. 연결 테스트: `frontend/.env`에 `VITE_USE_MOCK=false`, `VITE_API_BASE_URL=http://localhost:8000`을 넣고 `npm run dev`를 실행해요. 화면 코드는 고치지 않아도 돼요.

목 서버(`mockServer.ts`)가 아래 규칙을 그대로 흉내 내고 있어서, 응답이 헷갈리면 목 서버 코드를 보면 돼요.

## 1. 공통 규칙

- **JSON 키:** `snake_case`
- **경로:** `/api/...` (복수형 리소스명)
- **인증 쿠키:** 프론트는 `fetch(..., { credentials: 'include' })`로 요청해요. 개발 중 프론트(`localhost:5173`)와 백엔드(`localhost:8000`) 주소가 다르면 CORS 설정이 필요해요.
  - `allow_origins=["http://localhost:5173"]`
  - `allow_credentials=True`
- **에러 응답:** FastAPI 기본 형식에 `code`를 더해 주세요.
  ```json
  { "detail": "회사를 찾지 못했어요", "code": "COMPANY_NOT_FOUND" }
  ```
  - 프론트는 `detail`을 화면에 그대로 보여줄 수 있어요. 그러니 사용자가 읽을 문장(친근한 "~해요" 체)으로 써 주세요.
  - 4xx는 프론트가 다시 시도하지 않고, 5xx는 최대 2번 다시 시도해요.

| code | HTTP | 언제 |
|---|---|---|
| `COMPANY_NOT_FOUND` | 404 | 없는 종목코드 |
| `DATA_NOT_FOUND` | 404 | 재무·뉴스 같은 자료가 아직 없음 |

- **확인 전 숫자 (`SampleNumber`):** 아직 공식 자료로 확인하지 않은 값은 `is_sample: true`로 보내 주세요. 화면에 "예시 값" 배지가 붙어요.
  ```ts
  interface SampleNumber { value: number; is_sample: boolean }
  ```

## 2. API 목록

| # | 메서드 · 경로 | 화면 | 우선순위 |
|---|---|---|---|
| 1 | `GET /api/companies?query=&limit=20` | 검색 | P0 |
| 2 | `GET /api/companies/{stock_code}` | 기업 상세 헤더 | P0 |
| 3 | `GET /api/companies/{stock_code}/report` | AI 핵심 분석 | P0 |
| 4 | `POST /api/companies/{stock_code}/report` | AI 리포트 만들기 | P0 |
| 5 | `GET /api/companies/{stock_code}/financials` | 재무 상세 탭, 주요 지표 | P0 |
| 6 | `GET /api/companies/{stock_code}/news` | 뉴스 상세 탭 | P1 |
| 7 | `GET /api/companies/{stock_code}/prices?period=` | 주가 미니 차트 | P1 |
| 8 | `GET /api/home` | 메인 대시보드 | P1 |
| 9 | `GET /api/companies?stock_codes=a,b` | 관심 기업 | P2 |
| 10 | `GET /api/terms` | 용어 설명·카드·게임 | P2 (지금은 목 JSON으로 충분) |

### 1) 기업 검색

`GET /api/companies?query={검색어}&limit=20` → `CompanySummary[]`

- `query`: 한글 이름, 영어 이름, 종목코드 중 어느 것이든 돼요. 대소문자와 공백은 무시해 주세요.
- 결과는 최대 `limit`개(20)이고, 정확히 일치하는 기업이 먼저 오면 좋아요.
- 맞는 기업이 없으면 `[]`를 보내 주세요(404 아님).

```ts
interface CompanySummary {
  stock_code: string;            // "005930"
  corp_code: string | null;      // DART 고유번호
  name: string;                  // "삼성전자"
  name_en: string;               // "Samsung Electronics"
  sector: string;                // "반도체·전자제품"
  market: "KOSPI" | "KOSDAQ";
  current_price: SampleNumber;   // 원
  change_rate: SampleNumber;     // 전일 대비 %
  one_liner: string;             // "스마트폰과 반도체를 만드는 회사예요"
  market_alert: string | null;   // "투자경고" | "관리종목" | null → 화면에 "주의" 배지
}
```

`one_liner`는 사업보고서를 바탕으로 AI가 한 번 만들어 저장해 두면 돼요. 아직 없으면 `""`를 보내 주세요.

### 2) 기업 상세

`GET /api/companies/{stock_code}` → `CompanyDetail` (`CompanySummary`의 모든 필드 + 아래 필드)

```ts
interface CompanyDetail extends CompanySummary {
  market_cap: SampleNumber | null;      // 조 원, 모르면 null
  homepage_url: string;                 // 없으면 ""
  dart_url: string;
  business_description: string;         // 없으면 "" → "자료를 찾지 못했어요"
  business_segments: { code: string; name: string; description: string }[];
  timeline: { year: string; title: string; description: string; is_plan: boolean }[];
  timeline_source: string;
}
```

- **리포트가 없는 기업도 200으로 응답해 주세요.** 검색에서 고른 기업은 모두 이 화면으로 들어와요.
- 없는 종목코드면 `404 COMPANY_NOT_FOUND`를 보내 주세요.

### 3·4) AI 리포트

형식과 상태 규칙은 [`report-schema-proposal.md`](./report-schema-proposal.md)에 따로 정리했어요. 핵심만 적으면:

- `GET`은 **마지막으로 성공한 리포트 내용 + 지금 상태**(`none`/`generating`/`done`/`failed`)를 돌려줘요.
- `POST`는 생성을 시작하고 `generating`을 바로 돌려줘요. 프론트는 2초마다 `GET`으로 확인해요. 생성이 약 15초 걸리니 비동기 작업(BackgroundTasks 등)을 권해요.
- 숫자(`before`, `after`, `evidence`)는 백엔드가 공식 자료로 계산하고, AI는 문장(`headline`, `title`, `reason`, `meaning`)만 써요.
- 실패하면 `status: "failed"`와 `failure_reason`(사용자에게 보여줄 문장)을 보내 주세요.

### 5) 재무

`GET /api/companies/{stock_code}/financials` → `Financials` · 자료가 없으면 `404 DATA_NOT_FOUND`

```ts
interface Financials {
  stock_code: string;
  unit: string;                  // "조 원"
  basis: string;                 // "연결 기준"
  source: string;                // "삼성전자 공식 실적 발표 (2026년 1월)"
  annual: { fiscal_year: number; revenue: number; operating_income: number }[];  // 최근 3년
  latest_quarter: { label: string; revenue: number; operating_income: number; note: string };
  segments: { base_label: string; items: { code: string; name: string; revenue: number }[] };
  indicators: { roe: SampleNumber; debt_ratio: SampleNumber; per: SampleNumber; pbr: SampleNumber };
}
```

### 6) 뉴스

`GET /api/companies/{stock_code}/news` → `NewsItem[]` · 없으면 `[]`

```ts
interface NewsItem {
  id: string;
  title: string;
  url: string | null;
  source: string;                // 언론사
  published_at: string;          // 화면에 그대로 표시 (예: "2026-10-06" 또는 "2026년 1월")
  summary: string;               // 한 줄 요약 (AI)
  financial_link: { label: string; value: string } | null;
  is_placeholder: boolean;       // 실제 API에서는 항상 false
}
```

### 7) 주가

`GET /api/companies/{stock_code}/prices?period=1m|3m|6m|1y` → `PriceHistory`

```ts
interface PriceHistory {
  stock_code: string;
  period: "1m" | "3m" | "6m" | "1y";
  is_sample: boolean;
  points: { date: string /* YYYY-MM-DD */; close: number }[];  // 오래된 날짜부터
}
```

`1y`는 주 단위(약 52개), 나머지는 일 단위로 보내 주세요(pykrx).

### 8) 메인 대시보드

`GET /api/home` → `HomeDashboard` (`frontend/src/types/home.ts`)

```ts
interface HomeDashboard {
  base_time: string;                                   // "2026-10-06 15:30"
  trading_value_top: (CompanySummary & { trading_value: SampleNumber /* 억 원 */ })[];
  rising:      { criteria: string; items: CompanySummary[] };   // criteria: 화면에 그대로 표시
  most_viewed: { criteria: string; items: CompanySummary[] };
  ai_analyzed: { stock_code: string; name: string; headline: string; generated_at: string }[];
}
```

| 섹션 | 프론트 기본안 | 결정 필요 |
|---|---|---|
| 오늘 거래가 많은 기업 | 당일 거래대금 상위 8개 (pykrx) | – |
| 떠오르는 기업 | 기준 미정 (예: 최근 5일 거래대금 증가율 상위) | **백엔드 결정** |
| 관심도 높은 기업 | 다진에서 최근 7일 동안 많이 연 기업 상위 6개 | **조회 기록 저장 방식 결정** |
| AI가 분석한 기업 | `status: done`인 리포트의 최신 순 6개 | – |

### 9) 관심 기업

`GET /api/companies?stock_codes=005930,000660` → `CompanySummary[]` (요청한 순서대로)

관심 기업 목록은 지금 브라우저에 저장해요. 로그인이 붙으면 `/api/watchlist`로 옮길 예정이에요.

### 10) 용어

`GET /api/terms` → `Term[]` (지금은 `frontend/src/mocks/terms.json` 66개를 그대로 써도 돼요)

```ts
interface Term {
  id: string;
  term: string;
  aliases: string[];             // 본문에서 이 용어로 인식할 표현
  category: "basic" | "financial_statement" | "indicator" | "market" | "industry";
  level: "beginner" | "intermediate";
  easy: string;
  example: string;
}
```

## 3. 나중에 붙일 API (이번 범위 아님)

| API | 용도 |
|---|---|
| `GET /api/auth/google` → 콜백 → JWT 쿠키 발급 | Google 로그인 (`frontend/src/features/auth/AuthProvider.tsx` TODO) |
| `GET /api/auth/me` | 로그인 사용자 |
| `GET/PUT /api/watchlist` | 관심 기업 서버 저장 |
| 용어 게임 기록·최근 검색 서버 저장 | 지금은 브라우저 저장 (훅 안에서만 바꾸면 됨) |

## 4. 바뀐 점 (이전 목 API 대비)

- `GET /api/companies/popular`은 삭제했어요. 메인은 `GET /api/home`을 써요.
- 리포트가 없을 때 404 대신 `200 + status: "none"`으로 바꿨어요.
- `CompanySummary.has_report`를 삭제하고 `one_liner`, `market_alert`를 추가했어요.
- `CompanyDetail.market_cap`은 `null`일 수 있어요.
- `Term`은 `name`→`term`, `easy_meaning`→`easy`로 이름을 바꾸고 `category`, `level`을 추가했어요.
