# 프론트엔드 데이터 요구사항 (클라이언트 피드백 반영분)

> 작성: 프론트엔드 · 2026-10-19 (2026-10-27 PM·클라이언트 피드백 반영분 추가)
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

## 0. 공통 에러 형식 (2026-10-27 추가)

모든 API의 에러 응답은 아래 형식으로 맞춰 주세요. `message` 는 화면에 그대로 보여줄 수 있는 쉬운 문장이에요.

```json
{ "error": { "code": "COMPANY_NOT_FOUND", "message": "회사를 찾지 못했어요" } }
```

- 프론트 공통 요청 함수(`src/api/client.ts`)가 이 형식을 읽어요. 예전 형식 `{ "detail", "code" }` 도 함께 읽어서 옮기는 동안 깨지지 않아요.

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

### `CompanyDetail.industries` (추가, 2026-10-27)

| 항목 | 내용 |
|---|---|
| 타입 | `{ industry_id: string; name: string }[]` |
| 예시 | `[{ "industry_id": "ai", "name": "AI" }, { "industry_id": "semiconductor", "name": "반도체" }]` |
| 쓰는 화면 | 기업 상세 > 개요 "소속 산업" 칩 → 산업 페이지 |
| 없을 때 | 빈 배열이면 칩 숨김 (업종 글자만 보여요) |

### `Financials.recent_performance` (추가, 2026-10-27)

기업 상세 > 개요 "최근 사업 성과" (실적 발표 요약). `GET /api/companies/{code}/financials` 응답에 넣어 주세요.

```json
{
  "period_label": "2025년 4분기 실적",
  "announced_at": "2026-01-29",
  "revenue": { "value": 93.8, "unit": "조 원", "yoy_change_rate": 23.7, "yoy_is_sample": false },
  "operating_income": { "value": 20.1, "unit": "조 원", "yoy_change_rate": 209.2, "yoy_is_sample": false },
  "summary": "AI용 메모리(HBM) 판매가 늘면서 분기 기준 가장 많은 매출을 냈어요.",
  "segments": [{ "name": "DS(반도체)", "revenue": 44.0, "unit": "조 원" }],
  "source": { "title": "DART 공시명", "date": "2026-01-29", "url": "https://dart.fss.or.kr/..." }
}
```

| 칸 | 쓰는 곳 | 없을 때 |
|---|---|---|
| `period_label`, `announced_at` | "2025년 4분기 실적 · 2026년 1월 발표" | 필수 |
| `revenue`, `operating_income` | 큰 숫자 + "작년 같은 분기보다 ▲23.7%" | `yoy_change_rate` 가 null 이면 비교 줄 숨김 |
| `summary` | AI 한 줄 요약 (예측·권유 금지) | 필수 |
| `segments` | 사업별 매출 가로 막대 (값 표시) | 빈 배열이면 숨김 |
| `source` | 출처: DART 공시명 · 날짜 (링크) | 필수 |

- `recent_performance` 가 null 이면 "최근 실적 발표 자료를 아직 불러오지 못했어요"를 보여줘요.
- 목 데이터: 매출·영업이익·사업별 매출은 확인된 값, 작년 대비 변화율은 예시 값(`yoy_is_sample: true`)이에요.

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

- `rising` (떠오르는 기업): 화면에서 삭제했어요. (대신 "지금 관심이 몰리는 산업")
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

## 5. 뉴스 (2026-10-27 형식 변경)

메인 "왜 움직였나요?", 산업 페이지, 기업 상세(리포트 근거·뉴스 상세)가 같은 `NewsItem` 형식과 같은 목록 화면을 써요.
타입 원본: `frontend/src/types/news.ts` · 프론트 함수: `frontend/src/api/news.ts`

### 필요한 API

| API | 응답 | 쓰는 화면 |
|---|---|---|
| `GET /api/companies/{stock_code}/news?page=1&size=10` | `NewsPage { items, page, size, has_next }` | 기업 상세 > 뉴스 상세 (10개씩 + [더 보기]) |
| `GET /api/market/news?date=YYYY-MM-DD` | `NewsItem[]` | 메인 "오늘 시장이 왜 이렇게 움직였나요?" |
| `GET /api/industries/{industry_id}/news?size=5` | `NewsItem[]` | 산업 페이지 "관련 뉴스" (5개) |

리포트의 `evidence.news` 도 같은 `NewsItem` 형식이에요. (이전 `NewsEvidence` 삭제)

### `NewsItem`

```json
{
  "id": "a1b2c3",
  "title": "삼성전자, HBM4 공급 시작 계획 발표",
  "press": "삼성전자 뉴스룸",
  "published_at": "2026-01-29T10:00:00+09:00",
  "url": "https://news.samsung.com/kr/...",
  "summary_short": "다음 세대 AI 메모리인 HBM4 공급을 시작할 계획이라고 밝혔어요.",
  "summary_long": null,
  "company_stock_code": "005930",
  "related_metric": { "label": "반도체(DS) 매출", "value": "44.0조 원" }
}
```

| 칸 | 타입 | 상태 | 쓰는 곳 | 없을 때 |
|---|---|---|---|---|
| `id` | string | 필수 | 목록 키, 중복 제거 기준 | — |
| `title` | string | 필수 | 제목(원문 링크) | — |
| `press` | string | 이름 변경 (이전 `source`) | "언론사 · 3시간 전" | — |
| `published_at` | ISO 8601 (시간대 포함) | 형식 변경 (이전 "2026년 1월" 글자) | "3시간 전", 하루 넘으면 "10월 19일" | — |
| `url` | string | null 금지로 변경 | 원문 새 탭 | — |
| `summary_short` | string (한 문장) | 이름 변경 (이전 `summary`) | 목록 한 줄 요약 | 빈 문자열이면 요약 줄 숨김 |
| `summary_long` | string \| null | 추가 | (리포트 근거 확장용, 지금은 화면에 안 써요) | null |
| `company_stock_code` | string \| null | 추가 | 기업 기사·시장 기사 구분 | 시장·산업 기사면 null |
| `related_metric` | `{ label, value }` \| null | 이름 변경 (이전 `financial_link`) | 뉴스 상세 "관련 숫자" | null 이면 숨김 |
| `is_placeholder` | — | 삭제 | — | — |

### 지켜 주세요

1. **중복 제거**: 같은 기사(같은 원문 주소, 거의 같은 제목)는 한 번만.
2. **관련 기사만**: 그 기업·산업이 주제인 기사만. 이름만 스치는 기사는 빼 주세요.
3. **최신순**: `published_at` 내림차순.
4. **외부 뉴스 API는 서버에서만**: API 키는 서버에만 두고 브라우저로 내려보내지 않아요.
5. **기사 전문 저장·전달 금지**: 제목·요약·원문 링크만. 화면에서도 전문은 보여주지 않아요(저작권).
6. **요약 문장**: 쉬운 말로, 예측("오를 것")·투자 권유("사세요") 표현 없이.
7. 기사가 0건이면 에러 대신 빈 배열(`items: []`). 화면에 "아직 관련 뉴스가 없어요"가 나와요.

| 상황 | HTTP | code |
|---|---|---|
| 없는 종목코드·산업 | 404 | `COMPANY_NOT_FOUND`, `INDUSTRY_NOT_FOUND` |
| 잘못된 page·size·date | 400 | `INVALID_PARAM` |
| 외부 뉴스 API 실패 | 502 | `NEWS_SOURCE_UNAVAILABLE` |

## 6. 산업 (2026-10-27 추가)

타입 원본: `frontend/src/types/industry.ts` · 프론트 함수: `frontend/src/api/industries.ts` · 임시 기준: `frontend/src/config/industryHeat.ts`

### 6-1. 뜨는 산업 `GET /api/industries/hot?period=1w|1m`

메인 "지금 관심이 몰리는 산업" 아이콘 8~10개. 점수 높은 순으로 주세요.

```json
[
  {
    "industry_id": "ai",
    "name": "AI",
    "icon_key": "ai",
    "heat_score": 35.6,
    "heat_level": "high",
    "headline_metric": { "label": "최근 1주", "value": 6.2, "unit": "%" },
    "as_of": "2026-10-26T15:30:00+09:00",
    "is_sample": false
  }
]
```

| 칸 | 타입 | 쓰는 곳 | 없을 때 |
|---|---|---|---|
| `industry_id` | string | 산업 페이지 주소 `/industries/{industry_id}` | 필수 |
| `name` | string | 아이콘 아래 산업명 | 필수 |
| `icon_key` | string | 선 아이콘 (`ai`, `semiconductor`, `battery`, `bio`, `internet`, `auto`, `shipbuilding`, `defense`, `finance`, `game`) | 모르는 값이면 기본 아이콘 |
| `heat_score` | number | (순서 확인용) | 필수 |
| `heat_level` | `"high" \| "mid" \| "low"` | 아이콘 크기 (크게·중간·작게) | 필수 |
| `headline_metric` | `{ label, value, unit }` | "최근 1주 +6.2%" | 필수 (숫자 없는 아이콘은 안 보여줘요) |
| `as_of` | ISO 8601 | 기준 시각 (DataAsOf) | 필수 |
| `is_sample` | boolean | "예시 값" 배지 | false 로 보면 돼요 |

**임시 기준 (확정 필요)**: 기간 최근 1주(1주/1개월 전환), 점수 = 주가 상승률 40% + 거래대금 증가율 30% + 뉴스 언급 증가율 30%, 상위 3개 `high`, 다음 3개 `mid`, 나머지 `low`.
산업 목록 초안: AI, 반도체, 2차전지, 바이오, 인터넷·플랫폼, 자동차, 조선, 방산, 금융, 게임.

### 6-2. 산업 페이지 `GET /api/industries/{industry_id}`

```json
{
  "industry_id": "semiconductor",
  "name": "반도체",
  "icon_key": "semiconductor",
  "description": "컴퓨터·스마트폰의 두뇌와 기억 장치 역할을 하는 반도체를 … 산업이에요.",
  "why": { "text": "이번 달 반도체 수출이 작년보다 늘었다는 통계가 나왔어요. …", "news_ids": ["n1", "n2"] },
  "trend": [{ "date": "2026-09-28", "value": 0 }, { "date": "2026-10-26", "value": 10.1 }],
  "score_breakdown": { "price_change_rate": 4.8, "trading_value_change_rate": 35, "news_mention_change_rate": 40, "period": "1w" },
  "news": [/* NewsItem (근거 뉴스) */],
  "companies": [
    { "stock_code": "005930", "name": "삼성전자", "intro": "스마트폰과 반도체를 만드는 회사예요", "market_cap": 760, "change_rate": 1.82 }
  ],
  "as_of": "2026-10-26T15:30:00+09:00",
  "is_sample": false
}
```

| 칸 | 타입 | 쓰는 곳 | 없을 때 |
|---|---|---|---|
| `description` | string (한 줄) | 산업명 아래 설명 | 필수 |
| `why.text` | string (AI 정리 2~3문장, 예측·권유 금지) | "왜 관심이 몰리고 있나요?" | 빈 문자열이면 섹션 숨김 |
| `why.news_ids` | string[] | 근거 뉴스 칩 (`news` 의 `id`) | 빈 배열이면 칩 숨김 |
| `trend` | `{ date, value }[]` (주 단위 5개, 1개월 전 대비 누적 등락률 %) | "숫자로 보기" 그래프 (점마다 값 표시) | 빈 배열이면 그래프 숨김 |
| `score_breakdown` | 변화율 % 3개 + `period` | 점수 구성 표 (비중은 프론트 config) | 필수 |
| `news` | `NewsItem[]` | 근거 뉴스 | 빈 배열 |
| `companies` | `{ stock_code, name, intro, market_cap(조 원), change_rate(%) }[]` | 관련 기업 (시가총액 큰 순, 10개 + [더 보기]) | 빈 배열이면 "아직 정리된 기업이 없어요" |
| `as_of` | ISO 8601 | 상단 기준일 | 필수 |

- 관련 뉴스 5개는 `GET /api/industries/{industry_id}/news?size=5` (5장 뉴스 참고) 로 따로 받아요.
- `companies` 는 서버에서 시가총액 큰 순으로 정렬해 주세요. (프론트도 한 번 더 정렬해요)
- 없는 산업이면 `404 INDUSTRY_NOT_FOUND`.

## 7. 메인 "오늘의 시장" `GET /api/market/summary` (2026-10-27 추가)

타입 원본: `frontend/src/types/market.ts` · 프론트 함수: `frontend/src/api/market.ts`

```json
{
  "as_of": "2026-10-24T15:30:00+09:00",
  "is_previous_session": false,
  "headline": "반도체 강세에 코스피가 1% 넘게 올랐어요",
  "indices": [
    { "code": "KOSPI", "value": 2684.32, "change": 31.2, "change_rate": 1.18, "is_sample": false,
      "intraday": [{ "time": "09:00", "value": 2653.12 }] }
  ],
  "reasons": [
    { "title": "AI 서버용 메모리 기대가 커졌어요", "description": "…",
      "industries": [{ "industry_id": "semiconductor", "name": "반도체", "change_rate": 2.1 }], "news": [/* NewsItem */] }
  ]
}
```

| 칸 | 타입 | 쓰는 화면 | 없을 때 |
|---|---|---|---|
| `as_of` | ISO 8601 | 한마디 아래 "10월 24일 장 마감 기준" | 필수 |
| `is_previous_session` | boolean (요청 형식에 추가) | 장 시작 전·휴장일이면 "직전 거래일 기준" | 필수 |
| `headline` | string | 메인 맨 위 가장 큰 글자 (예측·투자 권유 표현 금지) | 필수 |
| `indices[].code` | `'KOSPI' \| 'KOSDAQ'` | 지수 이름 | 코스피는 필수, 코스닥은 없으면 숨김 |
| `indices[].value`, `change`, `change_rate` | number | 지수, 어제 대비 등락폭·등락률 (상승 빨강 ▲, 하락 파랑 ▼) | 필수 |
| `indices[].is_sample` | boolean (요청 형식에 추가) | true 면 "예시 값" 배지 | 필수 |
| `indices[].intraday` | `{ time, value }[]` | 작은 당일 흐름 선 그래프 | 없으면 그래프 숨김 |
| `reasons[]` | 최대 3개 | "오늘 시장이 왜 이렇게 움직였나요?" 카드 | 빈 배열이면 섹션 숨김 |
| `reasons[].industries` | `{ industry_id, name, change_rate }[]` | 관련 산업 칩 (예: 반도체 ▲2.1%), 누르면 산업 페이지 | 빈 배열이면 숨김 |
| `reasons[].news` | `NewsItem[]` | 근거 뉴스 (언론사·시간·원문 링크) | 빈 배열이면 숨김 |

- 응답이 실패하면 메인에 "시장 정보를 불러오지 못했어요"만 보여주고 검색창부터는 그대로 써요.
- `industry_id` 는 뜨는 산업(`GET /api/industries/hot`)과 같은 값을 써 주세요.
- 확인 필요: 한마디·이유를 누가(AI) 언제 만드는지.

## 확인이 필요한 것

1. `sector_group` 분류 기준 (예: 삼성전기·LG전자를 반도체로 볼지 기타로 볼지)
2. `sector_companies` 탭 안 정렬 기준과 개수
3. 근거 칩 `label` 에 출처 이름까지 넣을지 (예: "재무제표 2025 사업보고서" vs "재무제표")
4. 이용 제한 수치와, 실패한 생성도 횟수에 넣을지 (지금 프론트는 누를 때 바로 1회로 셈)
