# 다진(dajin) 프론트엔드: 시연용 UI

**웹 서비스 기준** 반응형 화면이에요. 넓은 화면(1024px 이상)은 본문과 사이드바 2단, 그보다 좁으면 1단으로 보여요.

주식 초보자를 위한 AI 기업 분석 서비스 **다진**의 시연용 프론트엔드예요.
지금은 백엔드 없이 `src/mocks/`의 목 데이터로 동작해요. 구조는 실제 API로 바로 바꿀 수 있게 잡아 두었어요.

## 실행 방법

```bash
cd frontend
npm install
npm run dev        # 개발 서버 (기본 http://localhost:5173)
npm run test       # Vitest + React Testing Library
npm run lint       # ESLint
npm run format     # Prettier로 전체 포맷
npm run build      # 타입 검사 + 프로덕션 빌드
```

환경 변수는 `.env.example`을 복사해서 `.env`로 만들어 써요. `.env`는 커밋하지 않아요.

| 변수                | 기본값  | 설명                                                         |
| ------------------- | ------- | ------------------------------------------------------------ |
| `VITE_USE_MOCK`     | `true`  | `false`로 바꾸면 실제 백엔드를 호출해요                      |
| `VITE_API_BASE_URL` | (빈 값) | 백엔드 주소. 비워두면 같은 도메인(Nginx 프록시)으로 요청해요 |

## 기술 스택

React 19 + TypeScript + Vite · TanStack Query · React Router · CSS Modules + CSS 변수 토큰 · Recharts · Pretendard · Vitest + RTL · ESLint + Prettier

## 폴더 구조

```
frontend/
├── src/
│   ├── api/              # 데이터 요청 함수. 컴포넌트는 fetch를 직접 부르지 않아요
│   │   ├── client.ts     #   VITE_USE_MOCK에 따라 목 서버와 실제 API 중 하나를 골라요
│   │   ├── companies.ts  #   searchCompanies, getCompanyReport, getFinancials, getNews ...
│   │   ├── terms.ts      #   getTerms
│   │   └── errors.ts     #   ApiError
│   ├── mocks/            # 목 데이터 JSON + mockServer.ts (api/ 에서만 import)
│   ├── types/            # 백엔드와 공유할 응답 타입 (키는 snake_case)
│   ├── hooks/            # TanStack Query 훅, localStorage 저장 훅, Context 훅
│   ├── components/       # 공통 컴포넌트 (TermText, TermSheet, StatusBadge, SampleBadge, BarChart ...)
│   ├── features/         # 기능별 컴포넌트
│   │   ├── chart/        #   차트 탭 (AI 분석 전 기본 화면: 주가·재무제표 그래프, 주요 지표)
│   │   ├── report/       #   AI 리포트 탭, 리포트 버튼, sections/, charts/(리포트 그래프)
│   │   ├── financials/   #   재무 분석 탭, 지표 계산(indicators.ts), 지표 신호등
│   │   ├── news/  company-info/  quiz/  term-cards/  watchlist/
│   │   └── auth/         #   AuthContext 뼈대 + Google 로그인 버튼
│   ├── pages/            # HomePage, CompanyPage, TermCardsPage, WatchlistPage
│   ├── styles/           # tokens.css(디자인 토큰, 라이트/다크), global.css
│   └── utils/            # 숫자 포맷, 용어 찾기
├── tests/                # TermSheet, 지표 신호등, 검색 테스트
└── .env.example
```

**데이터 흐름:** `api/ 함수 → hooks/ (TanStack Query) → 컴포넌트`. 컴포넌트는 `mocks/`를 import하지 않아요.

## 목 데이터를 실제 API로 바꾸는 방법

1. `.env`에 `VITE_USE_MOCK=false`, `VITE_API_BASE_URL=http://localhost:8000`을 넣어요.
2. 백엔드는 아래 경로와 `src/types/`의 타입(snake_case)에 맞춰 응답하면 돼요. 화면 코드는 바꿀 필요가 없어요.

| 함수 (`src/api/`)               | 요청                                                           | 응답 타입               |
| ------------------------------- | -------------------------------------------------------------- | ----------------------- |
| `searchCompanies(query)`        | `GET /api/companies?query=`                                    | `CompanySummary[]`      |
| `getPopularCompanies()`         | `GET /api/companies/popular`                                   | `CompanySummary[]`      |
| `getCompaniesByCodes(codes)`    | `GET /api/companies?stock_codes=a,b`                           | `CompanySummary[]`      |
| `getCompany(code)`              | `GET /api/companies/{stock_code}`                              | `CompanyDetail`         |
| `getFinancials(code)`           | `GET /api/companies/{stock_code}/financials`                   | `Financials`            |
| `getNews(code)`                 | `GET /api/companies/{stock_code}/news`                         | `NewsItem[]`            |
| `getPriceHistory(code, period)` | `GET /api/companies/{stock_code}/prices?period=1m\|3m\|6m\|1y` | `PriceHistory`          |
| `getSavedReport(code)`          | `GET /api/companies/{stock_code}/report` (없으면 404 → `null`) | `CompanyReport \| null` |
| `generateReport(code)`          | `POST /api/companies/{stock_code}/report`                      | `CompanyReport`         |
| `getTerms()`                    | `GET /api/terms`                                               | `Term[]`                |

- 오류 응답은 FastAPI 기본 형식 `{ "detail": "메시지", "code": "REPORT_NOT_READY" }`을 쓰면 화면에 그대로 보여요.
- AI 리포트는 **버튼을 눌러야** 만들어요. 화면을 열면 `GET .../report`로 저장된 리포트가 있는지만 확인하고, "AI 리포트 작성"을 누르면 `POST .../report`로 생성해요. 저장된 리포트가 있으면 버튼이 "저장된 AI 리포트 보기"로 바뀌고 바로 보여줘요.
- 이 흐름은 `src/hooks/useReportFlow.ts` 한 곳에서 관리해요. 생성이 오래 걸려 작업 큐(폴링/SSE)로 바꿀 때도 `api/companies.ts`의 `generateReport`와 이 훅만 고치면 돼요.
- 리포트의 `charts` 배열은 AI가 고른 그래프 목록이에요 (`type`, `title`, `caption`). 그래프 숫자는 항상 재무 데이터(`Financials`)에서 그리고, AI는 설명만 써요. 프론트가 모르는 `type`은 건너뛰어요.
- 목 모드에서 `mockServer.ts`는 동적 import로 따로 빌드돼요. 실제 API 모드에서는 불러오지 않아요.

## "예시 값"을 실제 수치로 바꾸는 방법

아직 확인하지 않은 값에는 `is_sample: true`가 붙어 있고, 화면에서 값 옆에 **예시 값** 배지가 떠요.
실제 수치로 바꿀 때는 `value`를 고치고 `is_sample`을 `false`로 바꿔요. 그러면 배지가 사라져요.

| 값                      | 파일                                                             | 위치                                                                                                    |
| ----------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 현재가                  | `src/mocks/samsungElectronics.json` + `src/mocks/companies.json` | `company.current_price` / 삼성전자 항목의 `current_price`                                               |
| 등락률                  | 위와 같음                                                        | `change_rate`                                                                                           |
| 시가총액 (조 원)        | `src/mocks/samsungElectronics.json`                              | `company.market_cap`                                                                                    |
| ROE (%)                 | `src/mocks/samsungElectronics.json`                              | `financials.indicators.roe`                                                                             |
| 부채비율 (%)            | 〃                                                               | `financials.indicators.debt_ratio`                                                                      |
| PER (배)                | 〃                                                               | `financials.indicators.per`                                                                             |
| PBR (배)                | 〃                                                               | `financials.indicators.pbr`                                                                             |
| 주가 그래프 (차트 탭)   | `src/mocks/mockServer.ts`                                        | `getPriceHistory`가 만드는 예시 흐름. 실제로는 한국거래소 시세 API 응답으로 교체하고 `is_sample: false` |
| 다른 회사 현재가·등락률 | `src/mocks/companies.json`                                       | 각 회사의 `current_price`, `change_rate`                                                                |
| 뉴스 3번                | `src/mocks/samsungElectronics.json`                              | `news[2]`: 실제 기사로 채우고 `is_placeholder: false`                                                   |
| 뉴스 원문 링크          | 〃                                                               | `news[0].url`, `news[1].url` (지금은 뉴스룸 첫 화면)                                                    |

매출 증가율과 영업이익률은 `financials.annual`의 원본 숫자로 `src/features/financials/indicators.ts`에서 계산해요. 따로 고칠 필요가 없어요.
신호등 기준(좋음/보통/주의)도 같은 파일에서 바꿔요.

## 향후 확장 (이번에는 구현하지 않음)

| 기능                                | 붙일 위치                                                                                                                                                            |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Google 로그인**                   | `src/features/auth/AuthProvider.tsx`의 `loginWithGoogle` 구현 (백엔드 OAuth → JWT). 버튼은 `LoginButton.tsx`                                                         |
| **서버에 관심 기업·용어 진행 저장** | `src/hooks/useWatchlist.ts`, `src/hooks/useTermProgress.ts` 안의 저장소만 API 호출로 교체. 쓰는 쪽 코드는 그대로                                                     |
| **다른 기업 리포트 추가**           | 백엔드 연결 후에는 자동. 목 모드에서는 `src/mocks/`에 `{회사}.json`을 만들고 `mockServer.ts`의 `companyData`에 등록한 뒤, `companies.json`의 `has_report`를 `true`로 |
| **리포트 섹션 추가/순서 변경**      | `src/features/report/reportSections.ts` 배열 수정 + `sections/`에 컴포넌트 추가                                                                                      |
| **커뮤니티**                        | `src/features/community/` + `src/pages/CommunityPage.tsx`, `App.tsx`에 라우트, `components/AppHeader.tsx` 메뉴에 추가. 기업별 토론은 `companyTabs.ts`에 탭을 추가    |
| **알림**                            | `src/features/notifications/` + `src/api/notifications.ts`. 관심 기업(`useWatchlist`)의 새 공시·뉴스 알림. 홈 헤더(`HomePage.tsx`)에 종 아이콘                       |
| **Face ID 로그인**                  | `AuthContext.ts`에 `loginWithPasskey` 추가 → WebAuthn(패스키)로 구현. 앱으로 감싸면 네이티브 생체 인증 연결                                                          |

## 시연 순서 안내

1. **홈**: "궁금한 회사를 쉽게 알아봐요". `삼성`, `samsung`, `005930` 중 아무거나 검색해요. 카카오 등 다른 회사를 누르면 "시연에서는 삼성전자 리포트만 준비되어 있어요" 안내가 떠요.
2. **삼성전자 선택 → 차트 탭**: AI 분석 전에 일반 주식 앱처럼 주가 흐름(1달/3달/6달/1년), 재무제표 한눈에(매출/영업이익 토글), 주요 지표를 보여줘요.
3. **AI 리포트 작성**: 오른쪽 사이드바(좁은 화면에서는 회사 정보 아래)의 "AI 리포트 작성" 버튼을 눌러요. 4단계가 차례로 체크되고, 요약이 타이핑되듯 나타난 뒤 "O초 만에 생성"이 떠요.
4. **리포트 보기**: 핵심 포인트 3가지 → **그래프로 보면**(매출·영업이익률·사업별 매출 그래프와 AI 설명) → 세 가지를 이어서 보면 → 좋은 점/지켜볼 점.
5. **용어 눌러 설명 보기**: 점선 밑줄 친 `HBM`이나 `영업이익`을 누르면 아래에서 설명 시트가 올라와요.
6. **재무 분석**: "재무제표 자세히 보기"를 눌러요. 사업별 매출, 지표 신호등, 원본 숫자 표를 보여줘요.
7. **뉴스**: 기사별 요약과 "재무 연결" 배지를 보여줘요.
8. **기업 정보**: 사업 설명, 회사의 방향 타임라인, 기본 정보를 보여주고, 맨 아래 **퀴즈 풀러 가기**를 눌러요.
9. **퀴즈**: 3문제를 풀고 점수를 확인해요.
10. (추가) 뒤로 갔다가 삼성전자를 **다시 열면** 버튼이 "저장된 AI 리포트 보기"로 바뀌고, 누르면 "저장된 리포트 · 바로 불러왔어요"로 즉시 보여줘요 (속도 개선 시연). 요약 카드의 "다시 작성하기"로 생성 과정을 다시 보여줄 수 있어요.
11. (추가) 하트 → 상단 메뉴 "관심 기업", "용어 카드"(뒤집기·알았어요·진행 막대·전체 용어 목록), 상단 오른쪽 버튼으로 라이트/다크 전환. 기업 화면에서는 상단 검색창으로 다른 회사를 바로 찾을 수 있어요.

> 저장된 리포트는 목 서버 메모리에 있어서, 새로고침하면 다시 "작성" 전 상태로 돌아가요.
