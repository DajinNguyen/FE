# 뉴스 API 요청서 (프론트 → 백엔드)

> 작성: 프론트엔드 · 2026-10-26
> 프론트는 목 데이터로 화면을 먼저 만들어 뒀어요. 아래 형식으로 API를 만들어 주시면 `VITE_USE_MOCK=false` 로 바로 연동돼요.
> 타입 원본: `frontend/src/types/news.ts`, 프론트 함수: `frontend/src/api/news.ts`

## 1. 필요한 API

| API | 쓰는 화면 |
|---|---|
| `GET /api/companies/{stock_code}/news?page=1&size=10` | 기업 상세 > 뉴스 상세 탭 (10개씩, [더 보기]) |
| `GET /api/market/news?date=YYYY-MM-DD` | 메인 "오늘 시장이 왜 이렇게 움직였나요?"의 근거 뉴스 |

리포트의 근거 뉴스(`GET /api/companies/{stock_code}/report` 의 `evidence.news`)도 같은 `NewsItem` 형식으로 맞춰 주세요.

### 1-1. 기업 뉴스

```
GET /api/companies/005930/news?page=1&size=10
```

```json
{
  "items": [
    {
      "id": "a1b2c3",
      "title": "삼성전자, HBM4 공급 시작 계획 발표",
      "press": "삼성전자 뉴스룸",
      "published_at": "2026-01-29T10:00:00+09:00",
      "url": "https://news.samsung.com/kr/...",
      "summary_short": "다음 세대 AI 메모리인 HBM4 공급을 시작할 계획이라고 밝혔어요.",
      "summary_long": "HBM 판매를 늘린 데 이어, 다음 세대 제품인 HBM4 공급을 시작할 계획이라고 밝혔어요.",
      "company_stock_code": "005930",
      "related_metric": { "label": "반도체(DS) 매출", "value": "44.0조 원" }
    }
  ],
  "page": 1,
  "size": 10,
  "has_next": true
}
```

### 1-2. 시장 뉴스

```
GET /api/market/news?date=2026-10-24
```

```json
[
  {
    "id": "m1",
    "title": "반도체 수출 증가세 이어져",
    "press": "OO경제",
    "published_at": "2026-10-24T14:10:00+09:00",
    "url": "https://...",
    "summary_short": "이번 달 반도체 수출이 작년보다 늘었다는 통계가 나왔어요.",
    "summary_long": null,
    "company_stock_code": null,
    "related_metric": null
  }
]
```

## 2. 칸 설명

| 칸 | 타입 | 필수 | 쓰는 곳 | 없을 때 화면 |
|---|---|---|---|---|
| `id` | string | 필수 | 목록 키 (중복 제거 기준으로도 써 주세요) | — |
| `title` | string | 필수 | 목록 제목, 원문 링크 글자 | — |
| `press` | string | 필수 | "삼성전자 뉴스룸 · 3시간 전" | — |
| `published_at` | string (ISO 8601, 시간대 포함) | 필수 | "3시간 전", 하루 넘으면 "10월 19일" | — |
| `url` | string | 필수 | 원문 링크 (새 탭) | — |
| `summary_short` | string (한 문장, 60자 안팎) | 필수 | 목록의 한 줄 요약 | 빈 문자열이면 요약 줄 숨김 |
| `summary_long` | string \| null | 선택 | 지금은 화면에 안 써요 (리포트 근거 확장용) | null |
| `company_stock_code` | string \| null | 필수 | 기업 기사인지 시장 기사인지 | 시장 기사면 null |
| `related_metric` | `{ label, value }` \| null | 선택 | 뉴스 상세 탭의 "관련 숫자" 줄 | null 이면 숨김 |
| `page`, `size`, `has_next` | number, number, boolean | 필수 (기업 뉴스) | [더 보기] 버튼 | `has_next: false` 면 버튼 숨김 |

## 3. 프론트가 기대하는 규칙

1. **중복 기사 제거**: 같은 기사(같은 원문 주소나 거의 같은 제목)는 한 번만 보내 주세요.
2. **기업명 관련 기사만**: 기업 뉴스는 그 기업이 주제인 기사만. 이름만 스치듯 나오는 기사는 빼 주세요.
3. **최신순**: `published_at` 내림차순.
4. **외부 뉴스 API 는 서버에서만 호출**: API 키는 서버에만 두고, 브라우저로 키가 내려오지 않게 해 주세요.
5. **기사 전문 저장·전달 금지**: 제목·요약·원문 링크만 주세요. 화면에서도 전문은 보여주지 않아요(저작권).
6. **요약 문장**: 초보자가 읽을 수 있는 쉬운 말로, 예측("오를 것")·투자 권유("사세요") 표현 없이.

## 4. 에러 응답 형식

```json
{ "error": { "code": "COMPANY_NOT_FOUND", "message": "회사를 찾지 못했어요" } }
```

| 상황 | HTTP | code |
|---|---|---|
| 없는 종목코드 | 404 | `COMPANY_NOT_FOUND` |
| 잘못된 page·size·date | 400 | `INVALID_PARAM` |
| 외부 뉴스 API 실패 | 502 | `NEWS_SOURCE_UNAVAILABLE` |

- 기사가 0건이면 에러 대신 빈 배열(`items: []`)로 주세요. 화면에 "아직 관련 뉴스가 없어요"가 나와요.
- 프론트의 공통 요청 함수(`src/api/client.ts`)는 이 `error` 형식을 읽어요. 예전 형식 `{ "detail", "code" }` 도 함께 읽어서, 다른 API 를 옮기는 동안에도 깨지지 않아요.

## 5. 연동 확인 방법

1. `frontend/.env` 에 아래처럼 적고 `npm run dev` 를 다시 실행해요.
   ```
   VITE_USE_MOCK=false
   VITE_API_BASE_URL=http://localhost:8000
   ```
2. 확인할 화면
   - 기업 뉴스: `http://localhost:5173/companies/005930?tab=news` → 10개 + [더 보기]
   - 시장 뉴스: `http://localhost:5173/` → "오늘 시장이 왜 이렇게 움직였나요?"의 근거 뉴스
3. 브라우저 개발자 도구 > 네트워크 탭에서 `/api/companies/005930/news?page=1&size=10` 요청과 응답 형식을 확인해요.
4. 목 데이터로 돌아가려면 `VITE_USE_MOCK=true` 로 바꿔요.
