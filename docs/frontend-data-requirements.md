# 프론트엔드 데이터 요구사항 (클라이언트 피드백 반영분)

> 작성: 프론트엔드 · 2026-10-19 (2026-10-27 PM·클라이언트 피드백 반영분 추가, 2026-11-02 목 데이터 제거)
> 이번 화면 개편에 필요한 데이터 칸을 정리했어요. 프론트는 `src/types/`에 먼저 반영했어요.
> 백엔드는 아래 칸을 기존 응답에 추가하면 돼요.
>
> - **2026-11-02부터 앱에 목 데이터가 없어요.** 모든 화면이 `VITE_API_BASE_URL` 의 실제 API 만 불러요.
> - 화면별로 부르는 API 전체 목록: 맨 아래 **9. 화면별 API 한눈에 보기**
> - 타입 원본: `frontend/src/types/*.ts` (이 문서와 다르면 타입이 기준)
> - 응답 예시: `frontend/tests/fixtures/` (테스트 전용, `mockServer.ts`, `companies.json`, `samsungElectronics.json`)
> - `is_sample`("예시 값" 배지) 칸은 화면에서 더 이상 쓰지 않아요. 보내도 무시해요.
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
  "revenue": { "value": 93.8, "unit": "조 원", "yoy_change_rate": 23.7 },
  "operating_income": { "value": 20.1, "unit": "조 원", "yoy_change_rate": 209.2 },
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

- `recent_performance` 가 null 이면 "최근 실적 발표 자료가 아직 없어요"를 보여줘요.

### `Financials.benchmarks`, `Financials.flags` (추가, 2026-10-27)

재무 상세 > 주요 지표를 "높은 편 / 보통 / 낮은 편"과 비교 문장으로 보여줘요. (예전 "좋음 / 보통 / 주의")

```json
{
  "benchmarks": {
    "operating_margin": { "basis": "sector_median", "basis_value": 7.5, "basis_label": "반도체 업종 중앙값" },
    "debt_ratio": { "basis": "general", "basis_value": 100, "basis_label": "일반적인 기준" }
  },
  "flags": { "is_financial": false, "is_loss": false, "is_capital_impaired": false }
}
```

| 칸 | 타입 | 쓰는 곳 | 없을 때 |
|---|---|---|---|
| `benchmarks.{지표}` | `{ basis: "sector_median" \| "general", basis_value: number \| null, basis_label }` | "반도체 업종 중앙값 7.5%보다 높은 편이에요" (기준값 ±10% 안이면 "비슷해요") | 프론트 기본 기준으로 판단, 비교 문장 숨김 |
| 지표 이름 | `revenue_growth`, `operating_margin`, `roe`, `debt_ratio`, `per` | | |
| `flags.is_financial` | boolean | 금융업은 부채비율 "평가 제외" | false |
| `flags.is_loss` | boolean | 적자면 PER "계산할 수 없어요" | false |
| `flags.is_capital_impaired` | boolean | 자본잠식이면 ROE·부채비율 "평가 제외" | false |

- 부채비율은 낮은 편이면 "낮은 편 · 안정적"으로 보여줘요.
- 업종 중앙값은 같은 업종 상장사의 최근 사업연도 값으로 계산해 주세요. (확정 필요)

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
| 비고 | 정렬 기준(시가총액·거래대금 등)은 백엔드에서 정해 주세요. 프론트는 받은 순서대로 보여줘요. |

### `base_time` (의미 명확히)

| 항목 | 내용 |
|---|---|
| 타입 | `string` (`YYYY-MM-DD HH:mm`) |
| 예시 | `"2026-10-16 15:30"` |
| 쓰는 화면 | 거래대금 리스트 위 "10월 16일 장 마감 기준" (15:30 이후면 "장 마감", 아니면 시각 표시) |
| 없을 때 | 필수 칸이에요 |

### 숨김·미사용 칸

- `rising` (떠오르는 기업): 화면에서 삭제했어요. (대신 "관심이 몰리는 산업")
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

### `key_points[].detail` (추가, 선택, 2026-10-27)

AI 분석 탭에서 포인트를 누르면 열리는 상세 시트에 써요.

```json
{
  "yearly": [{ "year": "2023", "revenue": 258.94, "operating_income": 6.57, "unit": "조 원" }],
  "related_news": [/* NewsItem */],
  "related_disclosures": [{ "title": "DART 공시명", "date": "2026-01-29", "url": "https://dart.fss.or.kr/..." }]
}
```

| 칸 | 쓰는 곳 | 없을 때 |
|---|---|---|
| `yearly` (3~5년, 오래된 해부터) | 연도별 매출·영업이익 막대 (값 표시) | 빈 배열이면 그래프 숨김 |
| `related_news` | 근거 뉴스 | 빈 배열이면 숨김 |
| `related_disclosures` | 근거 공시 (공시명·날짜·링크) | 빈 배열이면 숨김 |

- `detail` 이 없으면 시트에 숫자 변화·이유·의미·근거 칩만 보여줘요.

### `data_as_of` (추가, 선택)

| 항목 | 내용 |
|---|---|
| 타입 | `{ financials: string \| null; price: string \| null; news: string \| null } \| null` |
| 예시 | `{ "financials": "2025년 사업보고서", "price": "2026-10-05", "news": "2026-01-29" }` |
| 쓰는 화면 | 리포트 한 줄 결론 아래 "이 리포트는 재무 2025년 사업보고서 · 주가 10월 5일 · 뉴스 1월 29일 기준 자료로 만들었어요. 2026.10.6 09:00 생성" |
| 없을 때 | 칸이 없거나 `null` 이면 생성 시각만 보여요. 항목별 `null` 은 그 항목만 빼요. |
| 비고 | `financials` 는 자유 글자, `price`·`news` 는 YYYY-MM-DD 예요. |

## 4. 이용 제한 (지금은 프론트에서 흉내)

- 정책 값: `src/config/usagePolicy.ts` (임시값, PM 확정 필요) — 지금은 비로그인·로그인 모두 하루 무제한. 같은 기업 다시 만들기 간격 제한은 없앴어요 (2026-11-02)
- 지금은 기기(localStorage)에 횟수를 기록해요. 저장 로직은 `src/hooks/useReportQuota.ts` 한 곳에 모았어요.
- 서버로 옮길 때 제안 (합의 필요):
  - 리포트 응답 또는 별도 응답에 `{ limit: number; remaining: number }`
  - 제한에 걸리면 `POST /report` 가 `429` + `code: "DAILY_LIMIT"` 으로 알려 주기
- 이미 만들어진 리포트 보기(`GET /report`)는 제한하지 않아요.

### 낱말퀴즈 완료 보상 (2026-11-02 변경, 임시값 확정 필요)

- **퍼즐 3개**를 [정답 보기] 없이 다 풀면 리포트 만들기 1회 추가, 보상은 하루 최대 2회(퍼즐 6개), 로그인 사용자만. 같은 퍼즐은 하루 한 번만 세요.
- 퀴즈를 다 풀면 "AI 리포트까지 퀴즈 1/3", 3개를 채우면 "AI 리포트 1회가 추가됐어요"를 보여줘요.
- 값: `frontend/src/config/usagePolicy.ts` 의 `PUZZLE_REWARD`. 지금은 기기(localStorage)에 기록해요 (`useUsageCredits`).
- 서버로 옮길 때 필요한 것 (제안):
  - `POST /api/learn/crosswords/{puzzle_id}/complete` (body `{ "revealed": false }`) → `{ "counted": true, "solved_today": 2, "bonus_today": 0 }`
  - 남은 횟수 응답에 오늘 받은 보상 횟수 포함
- 퍼즐이 지금 3개뿐이라, 같은 퍼즐을 하루 한 번만 세면 보상은 하루 1회까지만 받을 수 있어요. 퍼즐을 6개 이상으로 늘려야 하루 2회가 가능해요.
- 하루 횟수 제한은 지금 임시로 무제한이라 보상 안내 문구는 숨겨져 있어요. 제한 값이 생기면 저절로 보여요.

## 5. 뉴스 (2026-10-27 형식 변경)

메인 "왜 움직였나요?", 산업 페이지, 기업 상세(리포트 근거·뉴스 상세)가 같은 `NewsItem` 형식과 같은 목록 화면을 써요.
타입 원본: `frontend/src/types/news.ts` · 프론트 함수: `frontend/src/api/news.ts`

### 필요한 API

| API | 응답 | 쓰는 화면 |
|---|---|---|
| `GET /api/companies/{stock_code}/news?page=1&size=10` | `NewsPage { items, page, size, has_next }` | 기업 상세 > 뉴스 상세 (10개씩 + [더 보기]) |
| `GET /api/market/news?date=YYYY-MM-DD` | `NewsItem[]` | 메인 "오늘 시장, 왜 움직였나요?" |
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

메인 "관심이 몰리는 산업" 아이콘 8~10개. 점수 높은 순으로 주세요.

```json
[
  {
    "industry_id": "ai",
    "name": "AI",
    "icon_key": "ai",
    "heat_score": 35.6,
    "heat_level": "high",
    "headline_metric": { "label": "최근 1주", "value": 6.2, "unit": "%" },
    "as_of": "2026-10-26T15:30:00+09:00"
  }
]
```

| 칸 | 타입 | 쓰는 곳 | 없을 때 |
|---|---|---|---|
| `industry_id` | string | 산업 페이지 주소 `/industries/{industry_id}` | 필수 |
| `name` | string | 아이콘 아래 산업명 | 필수 |
| `icon_key` | string | 선 아이콘 (`ai`, `semiconductor`, `battery`, `bio`, `internet`, `auto`, `shipbuilding`, `defense`, `finance`, `game`) | 모르는 값이면 기본 아이콘 |
| `heat_score` | number | 점수 높은 순 상위 3개만 보여줘요 (프론트가 다시 정렬해요) | 필수 |
| `heat_level` | `"high" \| "mid" \| "low"` | 화면에서 안 써요 (아이콘 크기는 순위로 정해요) | 보내도 돼요 |
| `headline_metric` | `{ label, value, unit }` | 아이콘 아래 "+6.2%" (label 은 화면 낭독용 "최근 1주 6.2% 상승") | 필수 (숫자 없는 아이콘은 안 보여줘요) |
| `as_of` | ISO 8601 | 아이콘 아래 기준일 (DataAsOf) | 필수 |

**임시 기준 (확정 필요)**: 기간 최근 1주(1주/1개월 전환), 점수 = 주가 상승률 35% + 거래대금 증가율 30% + 뉴스 언급 증가율 25% + 커뮤니티 활발도 10% (2026-11-02 변경), 메인에는 점수 상위 3개만 보여줘요 (1위일수록 아이콘이 커요). 4개 이상 보내도 돼요.
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
  "score_breakdown": { "price_change_rate": 4.8, "trading_value_change_rate": 35, "news_mention_change_rate": 40, "community_activity_change_rate": 20, "period": "1w" },
  "news": [/* NewsItem (근거 뉴스) */],
  "companies": [
    { "stock_code": "005930", "name": "삼성전자", "intro": "스마트폰과 반도체를 만드는 회사예요", "market_cap": 760, "change_rate": 1.82 }
  ],
  "as_of": "2026-10-26T15:30:00+09:00"
}
```

| 칸 | 타입 | 쓰는 곳 | 없을 때 |
|---|---|---|---|
| `description` | string (한 줄) | 산업명 아래 설명 | 필수 |
| `why.text` | string (AI 정리 2~3문장, 예측·권유 금지) | "왜 관심이 몰리고 있나요?" | 빈 문자열이면 섹션 숨김 |
| `why.news_ids` | string[] | 근거 뉴스 칩 (`news` 의 `id`) | 빈 배열이면 칩 숨김 |
| `trend` | `{ date, value }[]` | 화면에서 안 써요 (2026-11-02 산업 페이지의 최근 1개월 그래프 삭제) | 보내도 돼요 |
| `score_breakdown` | 변화율 % 4개 + `period` | 점수 구성 표 (비중은 프론트 config) | 필수 |
| `score_breakdown.community_activity_change_rate` | number (2026-11-02 추가) | 커뮤니티 활발도: 그 산업 기업들의 최근 1주 게시글·댓글 수 증가율 (%) | 없으면 표에 "준비 중" |
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
    { "code": "KOSPI", "value": 2684.32, "change": 31.2, "change_rate": 1.18,
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
| `indices[].intraday` | `{ time, value }[]` | 작은 당일 흐름 선 그래프 | 없으면 그래프 숨김 |
| `reasons[]` | 최대 3개 | "오늘 시장, 왜 움직였나요?" 카드 | 빈 배열이면 섹션 숨김 |
| `reasons[].industries` | `{ industry_id, name, change_rate }[]` | 관련 산업 칩 (예: 반도체 ▲2.1%), 누르면 산업 페이지 | 빈 배열이면 숨김 |
| `reasons[].news` | `NewsItem[]` | 근거 뉴스 (언론사·시간·원문 링크) | 빈 배열이면 숨김 |

- 응답이 실패하면 메인에 "시장 정보를 불러오지 못했어요"만 보여주고 검색창부터는 그대로 써요.
- `industry_id` 는 뜨는 산업(`GET /api/industries/hot`)과 같은 값을 써 주세요.
- 확인 필요: 한마디·이유를 누가(AI) 언제 만드는지.

## 8. 커뮤니티 (2026-10-27 추가)

기업 상세 > 커뮤니티 탭 (기업별 게시판). 타입 원본: `frontend/src/types/community.ts` · 프론트 함수: `frontend/src/api/community.ts` · 규칙 값: `frontend/src/config/communityRules.ts`

| 화면 | 주소 | 로그인 |
|---|---|---|
| 글 목록 | `/companies/{stock_code}?tab=community` | 보기는 필요 없음 |
| 글 보기 | `/companies/{stock_code}/community/{post_id}` | 보기는 필요 없음 |
| 글쓰기 · 수정 | `.../community/write`, `.../community/edit/{post_id}` | 필요 |
| 댓글 쓰기·지우기, 좋아요, 신고, 글 지우기 | — | 필요 |

### 8-1. API 목록

| 기능 | 요청 | 성공 응답 |
|---|---|---|
| 글 목록 | `GET /api/companies/{stock_code}/posts?sort=latest\|popular&category=question\|analysis\|news\|free&page=1&size=10` (category 없으면 전체) | `PostPage` |
| 글 하나 | `GET /api/posts/{post_id}` | `Post` |
| 글쓰기 | `POST /api/companies/{stock_code}/posts` body `PostInput` | `201` + `Post` |
| 글 수정 | `PUT /api/posts/{post_id}` body `PostInput` | `Post` |
| 글 지우기 | `DELETE /api/posts/{post_id}` | `204` |
| 댓글 목록 | `GET /api/posts/{post_id}/comments` (오래된 순) | `Comment[]` |
| 댓글 쓰기 | `POST /api/posts/{post_id}/comments` body `{ "body": "..." }` | `201` + `Comment` |
| 댓글 지우기 | `DELETE /api/comments/{comment_id}` | `204` |
| 좋아요 | `POST /api/posts/{post_id}/like` | `{ like_count, liked_by_me: true }` |
| 좋아요 취소 | `DELETE /api/posts/{post_id}/like` | `{ like_count, liked_by_me: false }` |
| 신고 | `POST /api/reports` body `ReportInput` | `204` |

- **인기순**: 좋아요 많은 순, 같으면 최신순.
- **좋아요**: 같은 요청을 여러 번 보내도 결과가 같게(멱등) 해 주세요. 프론트는 먼저 화면에 반영하고 실패하면 되돌려요.

### 8-2. 응답 형식

```json
// Post
{
  "id": "p1",
  "stock_code": "005930",
  "category": "question",
  "title": "HBM이 뭔지 쉽게 알려주실 분?",
  "body": "메모리를 여러 층 쌓은 거라고 들었는데…",
  "author": { "id": "u-a", "nickname": "주린이" },
  "created_at": "2026-10-26T13:00:00+09:00",
  "updated_at": null,
  "like_count": 12,
  "comment_count": 3,
  "liked_by_me": false,
  "reported_by_me": false,
  "is_mine": false,
  "is_hidden": false
}

// PostPage
{ "items": [/* Post */], "page": 1, "has_next": true }

// Comment
{
  "id": "c1",
  "post_id": "p1",
  "body": "여러 층으로 쌓아서 한 번에 데이터를 많이 주고받을 수 있는 메모리예요.",
  "author": { "id": "u-b", "nickname": "반도체공부중" },
  "created_at": "2026-10-26T13:30:00+09:00",
  "is_mine": false,
  "is_hidden": false
}

// PostInput
{ "category": "analysis", "title": "4분기 실적 정리해 봤어요", "body": "…" }

// ReportInput
{ "target_type": "post", "target_id": "p1", "reason": "solicitation" }
```

| 칸 | 설명 |
|---|---|
| `category` | `question` 질문 / `analysis` 분석 공유 / `news` 뉴스 / `free` 자유 |
| `author.nickname` | 화면에 보이는 이름. **실명(Google 이름) 대신 닉네임**을 주세요 (10대 사용자 보호) |
| `liked_by_me`, `reported_by_me`, `is_mine` | 지금 요청한 사람 기준. 비로그인이면 모두 `false` |
| `is_hidden` | 신고가 쌓여 숨긴 글·댓글이면 `true`. 이때 `title`·`body` 는 빈 문자열로 주세요 (화면: "신고로 숨겨진 글이에요") |
| `reason` | `solicitation` 투자 권유·리딩방 / `abuse` 욕설·비방 / `ad` 광고 / `privacy` 개인정보 노출 / `etc` 기타 |

### 8-3. 서버에서 지켜야 할 규칙

프론트도 같은 검사를 하지만, 프론트 검사는 쉽게 우회되니 **서버에서 반드시 한 번 더** 검사해 주세요.

| 규칙 | 값 | 어길 때 |
|---|---|---|
| 제목 글자 수 | 1~50자 (앞뒤 공백 제거 후) | `400 INVALID_LENGTH` |
| 본문 글자 수 | 1~2,000자 | `400 INVALID_LENGTH` |
| 댓글 글자 수 | 1~500자 | `400 INVALID_LENGTH` |
| 금지어 | 욕설, "리딩방", 오픈채팅·텔레그램 링크, "수익 보장"·"종목 추천" 류 (띄어쓰기 무시) | `400 BANNED_WORD` |
| 도배 방지 (임시값) | 같은 사람은 1분에 글 1개·댓글 5개 | `429 TOO_FREQUENT` |
| 신고 | 같은 사람은 같은 대상을 한 번만 | `409 ALREADY_REPORTED` |
| 신고 숨김 | 서로 다른 사람의 신고가 **3건** 쌓이면 자동 숨김 (`is_hidden: true`) | — |
| 수정·삭제 | 작성자 본인만 | `403 NOT_OWNER` |
| 로그인 필요 | 쓰기·수정·삭제·댓글·좋아요·신고 | `401 LOGIN_REQUIRED` |
| 없는 글 | — | `404 POST_NOT_FOUND` |

- 금지어 목록 시작점: `frontend/src/config/communityRules.ts` 의 `bannedRules`. 최종 목록은 PM과 정해 주세요.
- 글을 지우면 그 글의 댓글도 함께 지워 주세요.

### 8-4. 에러 응답 형식

```json
{ "error": { "code": "TOO_FREQUENT", "message": "글은 1분에 1개만 쓸 수 있어요. 잠시 후 다시 시도해 주세요" } }
```

`message` 는 화면에 그대로 보여줄 수 있는 쉬운 문장으로 주세요. (글쓰기 화면의 안내, 토스트에 나와요)

- 로그인 사용자 정보(`GET /api/auth/me`)에 `id`, `nickname` 도 넣어 주세요. `id` 는 `author.id` 와 같은 값이어야 해요. (없으면 화면은 `name` 을 써요)

### 8-5. 연동 확인 방법

1. `frontend/.env`
   ```
   VITE_API_BASE_URL=http://localhost:8000
   ```
2. `npm run dev` 후 `http://localhost:5173/companies/005930?tab=community`
3. 확인 순서: 목록(최신순·인기순·말머리) → 글 보기 → 로그인 → 글쓰기 → 댓글 → 좋아요 → 신고
4. [개발용 로그인]은 화면만 로그인 상태로 바꿔서 서버에 쓰면 401 이 나요. 그래서 **기본은 꺼져 있어요.** 서버 없이 화면만 볼 때 `frontend/.env` 에 `VITE_DEV_LOGIN=true` 를 넣으면 켜져요. 실제 백엔드와 확인할 때는 Google 로그인을 써 주세요.

### 8-6. 확인이 필요한 것

1. 닉네임은 어떻게 정할지 (가입 때 직접 / 자동 생성)
2. 신고로 숨긴 글을 누가 다시 확인하고 되살리는지 (관리자 화면은 이번 범위 밖)
3. 금지어 최종 목록과 갱신 방법
4. 좋아요 수가 많을 때 인기순 기간 (전체 기간 / 최근 7일)

## 확인이 필요한 것

1. `sector_group` 분류 기준 (예: 삼성전기·LG전자를 반도체로 볼지 기타로 볼지)
2. `sector_companies` 탭 안 정렬 기준과 개수
3. 근거 칩 `label` 에 출처 이름까지 넣을지 (예: "재무제표 2025 사업보고서" vs "재무제표")
4. 이용 제한 수치와, 실패한 생성도 횟수에 넣을지 (지금 프론트는 누를 때 바로 1회로 셈)

## 9. 화면별 API 한눈에 보기 (2026-11-02 추가)

앱에 목 데이터가 없어져서, 아래 API 가 없으면 그 영역에 "불러오지 못했어요 + 원인 + [다시 시도]"가 보여요.
한 영역이 실패해도 다른 영역과 검색창은 그대로 동작해요. 응답 칸은 각 장(또는 `API_SPEC.md`)을 봐 주세요.

| 화면 | 영역 | API | 자세한 곳 |
|---|---|---|---|
| 모든 화면 | 위쪽 검색창 | `GET /api/companies?query=&limit=20` | API_SPEC 1) |
| 모든 화면 | 로그인 상태 | `GET /api/auth/me` (비로그인은 401) | 8-4, API_SPEC 3 |
| 모든 화면 | 로그아웃 | `POST /api/auth/logout` | API_SPEC 3 |
| 모든 화면 | Google 로그인 | `GET /api/auth/google?next=` (페이지 이동) | API_SPEC 3 |
| 메인 | 오늘의 시장 (한마디·지수·왜 움직였나요) | `GET /api/market/summary` | 7 |
| 메인 | 관심이 몰리는 산업 (상위 3개) | `GET /api/industries/hot?period=1w\|1m` | 6-1 |
| 메인·거래 많은 기업 | 거래 많은 기업 TOP 5 / 전체 순위 | `GET /api/home` | 2 |
| 산업 페이지 | 설명·흐름·점수·관련 기업 | `GET /api/industries/{industry_id}` | 6-2 |
| 산업 페이지 | 관련 뉴스 | `GET /api/industries/{industry_id}/news?size=5` | 5 |
| 관심 기업 | 담은 기업 목록 | `GET /api/companies?stock_codes=a,b` | API_SPEC 9) |
| 기업 상세 | 머리(이름·주가·지표 칩), 개요 "무슨 사업을 하나요?" | `GET /api/companies/{stock_code}` | 1, API_SPEC 2) |
| 기업 상세 > 개요 | 최근 사업 성과 | `GET /api/companies/{stock_code}/financials` (`recent_performance`) | 1 |
| 기업 상세 > 개요 | 주가 흐름 (1달·3달·6달·1년) | `GET /api/companies/{stock_code}/prices?period=` | API_SPEC 7) |
| 기업 상세 > AI 분석 | 리포트 보기 / 만들기 | `GET·POST /api/companies/{stock_code}/report` | 3 |
| 기업 상세 > 재무 상세 | 재무제표·주요 지표 | `GET /api/companies/{stock_code}/financials` | 1 |
| 기업 상세 > 뉴스 상세 | 기업 뉴스 (페이지) | `GET /api/companies/{stock_code}/news?page=&size=` | 5 |
| 기업 상세 > 커뮤니티 | 글·댓글·좋아요·신고 | 8-1 의 API 전부 | 8 |
| 용어 학습 | 낱말퀴즈 목록·퍼즐 | `GET /api/learn/crosswords`, `GET /api/learn/crosswords/{puzzle_id}` | 백엔드 `app/schemas/crossword.py` |
| 용어 학습·용어 설명 | 카드 학습·문제·용어 밑줄 | `GET /api/terms` | API_SPEC 10) |

### 주가 흐름 그래프 색 (2026-11-02)

`PriceHistory.points` 의 첫 가격과 마지막 가격을 비교해서 프론트가 색을 정해요. (올랐으면 빨강, 내렸으면 파랑, 같으면 회색)
그래서 `points` 는 **날짜 오름차순**으로 보내 주세요.

## 10. 커뮤니티 변경 (2026-11-02 추가)

### 10-1. 기업 커뮤니티 = 바로 쓰는 댓글 + 답글 (2026-11-02 변경)

- 글쓰기 화면·글 보기 화면을 없앴어요. 기업 화면 커뮤니티 탭에서 **바로 댓글을 쓰고**, 그 댓글에 **답글**을 달아요.
- 지금 백엔드 API 를 그대로 써요. 새 API 는 필요 없어요.

| 화면 | 쓰는 API | 비고 |
|---|---|---|
| 기업 댓글 목록 (최신순·인기순, 10개씩) | `GET /api/companies/{stock_code}/posts` | 글 = 기업 댓글. `category` 는 항상 `"free"` |
| 기업 댓글 쓰기 | `POST /api/companies/{stock_code}/posts` | `{ "category": "free", "body": "…" }` |
| 기업 댓글 지우기·좋아요·신고 | `DELETE /api/posts/{id}`, `POST·DELETE /api/posts/{id}/like`, `POST /api/reports` (`target_type: "post"`) | |
| 답글 목록 | `GET /api/posts/{post_id}/comments` | "답글 N개 보기"(N = `comment_count`)를 누르면 불러요 |
| 답글 쓰기 | `POST /api/posts/{post_id}/comments` | `{ "body": "…", "reply_to_nickname": "주린이" }` |

- ⚠️ 지금 백엔드 `PostInput.title` 이 필수라서, 프론트가 **본문 첫 줄(30자)을 title 로 채워 보내요** (`src/api/community.ts` 의 `withTitle`). 화면에서는 title 을 쓰지 않아요. 백엔드에서 title 을 빼면 그 함수만 지우면 돼요.
- 예전 주소 `/companies/{code}/community/write`, `/community/{postId}` 는 커뮤니티 탭으로 보내요.

### 10-2. 답글 칸 (백엔드 변경 예정)

답글은 한 단계만 들여 써요. 답글에 다시 답하면 같은 단계에 "@닉네임"을 붙여요.

`POST /api/posts/{post_id}/comments` 요청에 칸 추가 (칸 이름은 지금 백엔드에 맞춰 `body` 그대로):

```json
{ "body": "저도 궁금했어요", "reply_to_nickname": "주린이", "image_url": null }
```

`Comment` 응답에 칸 추가:

| 칸 | 타입 | 쓰는 곳 | 없을 때 |
|---|---|---|---|
| `reply_to_nickname` | string \| null | 답글의 답글이면 "@닉네임" 표시 | 숨김 |
| `is_deleted` | boolean | 지웠지만 자리를 남긴 답글 → "삭제된 댓글이에요" | false |
| `image_url` | string \| null | 답글 사진 (작게, 누르면 크게) | 숨김 |

- `Post` 에도 `image_url` (string \| null) 을 추가해 주세요 (기업 댓글 사진). 요청 `PostInput.image_url` 도 같이.
- `parent_id`, `reply_count` 는 위 구조(글 = 댓글, 댓글 = 답글)에서는 필요 없어요. 보내도 돼요.

### 10-3. 다진 전용 이모지 (에셋 필요)
- 댓글 본문에 `:dajin-아이디:` 로 들어가요 (예: `:dajin-like:`). 서버는 글자 그대로 저장하면 돼요.
- 이미지 위치: `frontend/public/emoji/dajin/{아이디}.png`, 목록: `frontend/src/config/dajinEmojis.ts`
- 지금은 에셋이 없어서 이모지 패널에 "다진 이모지를 준비하고 있어요"가 보여요.
- 필요한 이모지 (초안, 다진 캐릭터로 새로 그려야 해요. 다른 서비스 캐릭터 사용 금지):

| 아이디 | 이름 | 대체 텍스트 |
|---|---|---|
| `like` | 좋아요 | 엄지를 든 다진 |
| `curious` | 궁금해요 | 고개를 갸웃하는 다진 |
| `surprised` | 놀라요 | 눈이 커진 다진 |
| `studying` | 공부 중 | 책을 보는 다진 |
| `cheer` | 응원해요 | 깃발을 흔드는 다진 |

- 크기: 정사각형 PNG(투명 배경), 화면 표시 64px 기준 **2배 128×128px**, 한 장 50KB 이하 권장.

### 10-4. 댓글 사진 업로드 (백엔드 필요)
- `POST /api/uploads` (multipart/form-data, 칸 이름 `file`, 로그인 필요) → `{ "image_url": "https://..." }`
- 프론트 제한 (임시값, `src/config/communityRules.ts` 의 `IMAGE_UPLOAD`): jpg·png·webp, 5MB 이하, 댓글 1개에 1장. 서버도 같은 규칙으로 검사해 주세요.
- 실패하면 `{ "error": { "code": "FILE_TOO_LARGE" | "INVALID_TYPE", "message": "…" } }`
- 2026-11-03 부터 사진 버튼이 켜져 있어요 (`IMAGE_UPLOAD.enabled: true`). 업로드 서버에 문제가 있으면 `false` 로 바꿔 "사진 (준비 중)" 으로 돌릴 수 있어요.
- 기업 댓글(`Post.image_url`)과 답글(`Comment.image_url`) 사진을 모두 보여줘요.
- 글자 수: 기업 댓글 2,000자, 답글 500자
- 신고 사유에 `image`(부적절한 사진)를 추가했어요. `ReportInput.reason` 에 `"image"` 가 올 수 있어요.


## 11. 기업 목록 범위: OpenDART 상장사 전체 (2026-11-02 추가)

- 지금 백엔드 `app/data/companies.json` 에는 **135개**만 있어서 검색도 135개 안에서만 돼요.
- 요청: 검색(`GET /api/companies?query=&limit=20`)과 기업 상세가 **OpenDART 고유번호 목록(corpCode.xml)에서 종목코드(stock_code)가 있는 상장사 전체**(코스피·코스닥·코넥스, 약 2,700곳)를 다루게 해 주세요. 백엔드 `app/services/dart.py` 가 이미 corpCode.xml 을 받아 캐시하고 있어요.
- 프론트는 기업 수와 상관없이 동작해요. 검색은 서버가 준 결과를 최대 20개까지 보여주고, 상세는 종목코드로 불러요.
- 자동으로 늘어난 기업은 정리된 글이 없을 수 있어요. 아래 칸은 비어 있어도 화면이 깨지지 않아요.

| 칸 | 비어 있을 때 |
|---|---|
| `one_liner` | 빈 문자열이면 목록에서 그 줄을 숨겨요 |
| `sector`, `sector_group` | `sector` 는 DART 업종명, `sector_group` 은 `"etc"` 로 주세요 |
| `market` | `"KOSPI"`, `"KOSDAQ"`, `"KONEX"` 중 하나 (2026-11-02 KONEX 추가) |
| `business_description`, `business_segments` | 빈 값이면 "사업보고서 내용을 아직 불러오지 못했어요" |
| `timeline` | 빈 배열이면 "회사의 방향" 숨김 |
| `industries` | 빈 배열이면 소속 산업 칩 숨김 |
| `market_cap` | null 이면 시가총액 숨김 |

- 재무·리포트 자료가 아직 없는 기업은 지금처럼 `404 DATA_NOT_FOUND` 로 주면 "아직 자료가 없어요" 안내가 나와요.
