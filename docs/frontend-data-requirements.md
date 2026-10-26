# 프론트엔드 데이터 요구사항 (클라이언트 피드백 반영분)

> 작성: 프론트엔드 · 2026-10-19
> 이번 화면 개편에 필요한 데이터 칸을 정리했어요. 프론트는 `src/types/`와 `src/mocks/`에 먼저 반영했고,
> `src/api/` 함수(요청 주소·방식)는 바꾸지 않았어요. 백엔드는 아래 칸을 기존 응답에 추가하면 돼요.
>
> - 타입 원본: `frontend/src/types/*.ts` (이 문서와 다르면 타입이 기준)
> - 예시 값: `frontend/src/mocks/` (`mockServer.ts`, `companies.json`, `samsungElectronics.json`)
> - `API_SPEC.md`에는 아직 반영하지 않았어요. 백엔드와 합의되면 함께 고칠게요.

## 한눈에 보기

| 응답 | 칸 | 상태 |
|---|---|---|
| `GET /api/companies…` 의 기업 항목 (`CompanySummary`) | `sector_group` | 추가 (필수) |
| `GET /api/companies/{code}` (`CompanyDetail`) | `price_as_of` | 추가 |
| `GET /api/companies/{code}/financials` (`Financials`) | `indicators_as_of` | 추가 |
| `GET /api/home` (`HomeDashboard`) | `trading_value_top[].ai_headline` | 추가 |
| `GET /api/home` | `trading_value_top` | 개수 변경 (최대 30개) |
| `GET /api/home` | `sector_companies` | 추가 |
| `GET /api/home` | `base_time` | 의미 명확히 (직전 거래일 장 마감) |
| `GET /api/home` | `rising`, `most_viewed`, `ai_analyzed` | 화면에서 숨김·미사용 (보내도 됨) |
| `GET·POST /api/companies/{code}/report` (`CompanyReport`) | `key_points[].evidence` | **형식 변경** |
| `GET·POST /api/companies/{code}/report` | `data_as_of` | 추가 (선택) |

## 1. 기업 목록·상세

### `CompanySummary.sector_group` (추가, 필수)

| 항목 | 내용 |
|---|---|
| 타입 | `'semiconductor' \| 'auto' \| 'internet' \| 'finance' \| 'food' \| 'etc'` |
| 예시 | `"semiconductor"` (삼성전자), `"food"` (오리온) |
| 쓰는 화면 | 메인 "업종별 기업" 탭 |
| 없을 때 | 필수 칸이에요. 어느 묶음에도 안 맞으면 `"etc"`(기타) |
| 비고 | 탭 이름·순서는 프론트 상수(`src/config/sectorGroups.ts`)로 고정: 반도체 / 자동차 / 인터넷 / 금융 / 식품 / 기타. 화면에 보이는 자세한 업종 이름은 기존 `sector` 그대로 써요. |

### `CompanyDetail.price_as_of` (추가)

| 항목 | 내용 |
|---|---|
| 타입 | `string \| null` (YYYY-MM-DD) |
| 예시 | `"2026-10-16"` |
| 쓰는 화면 | 기업 상세 헤더의 현재가 옆 "10월 16일 기준" |
| 없을 때 | `null` 이면 기준일 글자를 숨겨요 |
| 비고 | 실시간 시세가 아니라 직전 거래일 종가일 수 있다는 걸 알려주는 용도예요. |

### `Financials.indicators_as_of` (추가)

| 항목 | 내용 |
|---|---|
| 타입 | `string \| null` (자유 글자) |
| 예시 | `"2025년 사업보고서"` |
| 쓰는 화면 | 기업 상세 오른쪽 "주요 지표"(PER·PBR·ROE·부채비율) 아래 "2025년 사업보고서 기준" |
| 없을 때 | `null` 이면 기준 표시를 숨겨요 |

## 2. 메인 대시보드 `GET /api/home`

### `trading_value_top` (개수 변경)

| 항목 | 내용 |
|---|---|
| 타입 | `TradingCompany[]` (최대 30개, 거래대금 많은 순) |
| 쓰는 화면 | 메인 "오늘 거래가 많은 기업"은 앞 10개, "전체 보기"(`/rankings/trading`)는 받은 전체 |
| 없을 때 | 빈 배열이면 목록 없이 제목만 보여요 |
| 비고 | API 함수를 늘리지 않으려고 전체 순위 화면도 같은 응답을 써요. 따로 순위 API를 만들면 그때 나눌게요. |

### `trading_value_top[].ai_headline` (추가)

| 항목 | 내용 |
|---|---|
| 타입 | `string \| null` |
| 예시 | `"AI용 메모리가 잘 팔리면서 3년 만에 이익이 크게 늘어난 회사예요"` |
| 쓰는 화면 | 메인·전체 순위 리스트의 "AI 결론" 줄 |
| 없을 때 | `null` 이면 그 줄을 숨겨요 |
| 비고 | 그 기업의 마지막 성공 리포트 `headline` 과 같은 값이면 돼요. 리포트가 없는 기업은 `null`. |

### `sector_companies` (추가)

| 항목 | 내용 |
|---|---|
| 타입 | `Record<SectorGroup, CompanySummary[]>` (6개 키 모두) |
| 예시 | `{ "semiconductor": [삼성전자, SK하이닉스, …], "food": [CJ제일제당, 오리온, …], … }` |
| 쓰는 화면 | 메인 "업종별 기업" 탭 (탭마다 앞 5개) |
| 없을 때 | 빈 배열이면 "이 업종의 기업은 아직 준비 중이에요" |
| 비고 | 정렬 기준(시가총액·거래대금 등)은 백엔드에서 정해 주세요. 지금 목 데이터는 목록 순서예요. |

### `base_time` (의미 명확히)

| 항목 | 내용 |
|---|---|
| 타입 | `string` (`YYYY-MM-DD HH:mm`) |
| 예시 | `"2026-10-16 15:30"` |
| 쓰는 화면 | 거래대금 리스트 위 "10월 16일 장 마감 기준" (15:30 이후면 "장 마감", 아니면 시각 표시) |
| 없을 때 | 필수 칸이에요 |

### 숨김·미사용 칸

- `rising` (떠오르는 기업): 선정 기준이 정해질 때까지 숨겨요. `VITE_FEATURE_RISING_COMPANIES=true` 로 켤 수 있어요.
- `most_viewed`, `ai_analyzed`: 메인 섹션을 5개 이하로 줄이면서 화면에서 뺐어요. 계속 보내도 문제없어요.

## 3. AI 리포트 `GET·POST /api/companies/{code}/report`

### `key_points[].evidence` (형식 변경)

| 항목 | 내용 |
|---|---|
| 이전 | `("financials" \| "news" \| "vision")[]` |
| 이후 | `{ type: "financials" \| "news" \| "vision"; label: string; date: string \| null }[]` |
| 예시 | `{ "type": "news", "label": "뉴스", "date": "2026-10-15" }` → 칩 "뉴스 10.15"<br>`{ "type": "financials", "label": "재무제표 2025 사업보고서", "date": null }` → 칩 "재무제표 2025 사업보고서" |
| 쓰는 화면 | 핵심 포인트마다 근거 칩. 누르면 같은 화면의 해당 근거 자료(`type`)로 이동 |
| 없을 때 | 빈 배열이면 근거 줄을 숨겨요. `date` 가 `null` 이면 `label` 만 보여요. `date` 가 YYYY-MM-DD 가 아니면 받은 글자를 그대로 붙여요. |

### `data_as_of` (추가, 선택)

| 항목 | 내용 |
|---|---|
| 타입 | `{ financials: string \| null; price: string \| null; news: string \| null } \| null` |
| 예시 | `{ "financials": "2025년 사업보고서", "price": "2026-10-05", "news": "2026-01-29" }` |
| 쓰는 화면 | 리포트 한 줄 결론 아래 "이 리포트는 재무 2025년 사업보고서 · 주가 10월 5일 · 뉴스 1월 29일 기준 자료로 만들었어요. 2026.10.6 09:00 생성" |
| 없을 때 | 칸이 없거나 `null` 이면 생성 시각만 보여요. 항목별 `null` 은 그 항목만 빼요. |
| 비고 | `financials` 는 자유 글자, `price`·`news` 는 YYYY-MM-DD 예요. |

## 4. 이용 제한 (지금은 프론트에서 흉내)

- 정책 값: `src/config/usagePolicy.ts` (임시값, PM 확정 필요) — 비로그인 하루 1회, 로그인 하루 3회, 같은 기업 다시 만들기 10분 간격
- 지금은 기기(localStorage)에 횟수를 기록해요. 저장 로직은 `src/hooks/useReportQuota.ts` 한 곳에 모았어요.
- 서버로 옮길 때 제안 (합의 필요):
  - 리포트 응답 또는 별도 응답에 `{ limit: number; remaining: number; next_available_at: string | null }`
  - 제한에 걸리면 `POST /report` 가 `429` + `code: "DAILY_LIMIT" | "REGENERATE_TOO_SOON"` 으로 알려 주기
- 이미 만들어진 리포트 보기(`GET /report`)는 제한하지 않아요.

## 4-1. 뉴스 (2026-10-26 형식 변경)

자세한 요청은 `docs/news-api-request.md` 를 봐 주세요.

| 칸 | 상태 | 타입 | 쓰는 화면 | 없을 때 |
|---|---|---|---|---|
| `press` | 이름 변경 (이전 `source`) | string | 뉴스 목록 "언론사 · 시간" | 필수 |
| `published_at` | 형식 변경 (이전 "2026년 1월" 글자) | ISO 8601 | "3시간 전" / "10월 19일" | 필수 |
| `url` | null 금지로 변경 | string | 원문 새 탭 | 필수 |
| `summary_short` | 이름 변경 (이전 `summary`) | string | 목록 한 줄 요약 | 빈 문자열이면 숨김 |
| `summary_long` | 추가 | string \| null | (리포트 근거 확장용) | null |
| `company_stock_code` | 추가 | string \| null | 기업·시장 기사 구분 | 시장 기사면 null |
| `related_metric` | 이름 변경 (이전 `financial_link`) | `{label, value}` \| null | 뉴스 탭 "관련 숫자" | null 이면 숨김 |
| `is_placeholder` | 삭제 | — | — | — |

- 기업 뉴스는 `GET /api/companies/{stock_code}/news?page=&size=` 로 페이지 단위(`{ items, page, size, has_next }`)로 받아요.
- 리포트의 `evidence.news` 도 같은 `NewsItem` 형식이에요. (이전 `NewsEvidence` 삭제)
- 에러 응답은 `{ "error": { "code", "message" } }` 를 읽어요. (예전 `{ detail, code }` 도 함께 읽어요)

## 확인이 필요한 것

1. `sector_group` 분류 기준 (예: 삼성전기·LG전자를 반도체로 볼지 기타로 볼지)
2. `sector_companies` 탭 안 정렬 기준과 개수
3. 근거 칩 `label` 에 출처 이름까지 넣을지 (예: "재무제표 2025 사업보고서" vs "재무제표")
4. 이용 제한 수치와, 실패한 생성도 횟수에 넣을지 (지금 프론트는 누를 때 바로 1회로 셈)
