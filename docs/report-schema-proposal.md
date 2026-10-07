# AI 리포트 응답 형식 제안 (v0.1)

| 항목 | 내용 |
|---|---|
| 작성 | 프론트엔드 (노현승) |
| 대상 | AI·리포트 엔진 (조현아), 백엔드 |
| 상태 | **프론트 기본안** · 프론트는 이 형식의 목 데이터로 화면을 완성했어요. 바꿀 점은 PR 코멘트로 알려 주세요 |
| 근거 | 2026-10-06 클라이언트 3차 미팅 피드백 (기업 상세 = AI 핵심 분석 중심) |
| 프론트 타입 | `frontend/src/types/report.ts` |
| 전체 API 명세 | [`API_SPEC.md`](./API_SPEC.md) |

## 1. 원칙

1. **숫자는 백엔드가, 문장은 AI가.** `before`, `after`, `evidence`의 숫자는 백엔드가 DART·한국거래소 공식 자료로 계산해서 넣어요. AI는 `headline`, `title`, `reason`, `meaning`만 써요.
2. **핵심 포인트는 항상 5개, 항상 같은 순서예요.** 프론트는 `category` 기준으로 정렬하고, 모르는 `category`는 맨 뒤로 보내요.
3. **근거 자료가 일부 비어도 화면 전체가 깨지지 않아요.** `financials`나 `vision`이 `null`이거나 `news`가 `[]`이면, 그 칸에만 "자료를 찾지 못했어요"를 보여줘요.
4. JSON 키는 `snake_case`로 써요.

## 2. API

| 메서드 | 경로 | 설명 |
|---|---|---|
| `GET` | `/api/companies/{stock_code}/report` | **마지막으로 성공한 리포트 내용 + 지금 상태**. 한 번도 만든 적 없으면 `status: "none"` |
| `POST` | `/api/companies/{stock_code}/report` | 새로 만들기 시작. `status: "generating"`을 돌려주면 프론트가 2초마다 `GET`으로 확인해요. 바로 `"done"`을 돌려줘도 동작해요 |

상태별 `GET` 응답 규칙:

| 상황 | status | 내용(headline, key_points 등) |
|---|---|---|
| 한 번도 만든 적 없음 | `none` | 비어 있음 |
| 처음 만드는 중 | `generating` | 비어 있음 |
| 다시 만드는 중 | `generating` | **이전 리포트 내용 그대로** |
| 완료 | `done` | 새 내용 |
| 처음 만들기 실패 | `failed` + `failure_reason` | 비어 있음 |
| 다시 만들기 실패 | `failed` + `failure_reason` | **이전 리포트 내용 그대로** |

프론트는 `key_points`가 비어 있지 않으면 내용을 보여주고, `status`로 진행 표시줄이나 실패 알림을 띄워요.
그래서 백엔드는 기업별 리포트 한 건에 "마지막 성공 내용"과 "현재 상태"만 저장하면 돼요.

## 3. 형식

```ts
interface CompanyReport {
  stock_code: string;
  status: "none" | "generating" | "done" | "failed";
  generated_at: string | null;            // ISO 8601
  headline: string;                       // AI 한 줄 결론
  key_points: {
    category: "performance" | "revenue_source" | "recent_change" | "risk" | "strength";
    title: string;                        // 한 줄 결론
    before: { label: string; value: string; period: string } | null;
    after:  { label: string; value: string; period: string } | null;
    reason: string;                       // 왜 그런가요? (1~2문장)
    meaning: string;                      // 무슨 뜻인가요? (1문장)
    evidence: ("financials" | "news" | "vision")[];
  }[];
  evidence: {
    financials: {
      unit: string;
      years: string[];
      revenue: number[];
      operating_income: number[];
      highlights: { label: string; value: string; source: string; is_sample?: boolean }[];
      base_date?: string;                 // (추가 제안)
    } | null;
    news: { title: string; press: string; published_at: string; summary: string; url: string }[];
    vision: {
      summary: string;
      revenue_mix: { name: string; amount: number; unit: string; period: string }[];
      source: string;
      base_date?: string;                 // (추가 제안)
    } | null;
  };
  quiz: { question: string; options: string[]; answer_index: number; explanation: string }[];
  sources: string[];
  failure_reason?: string | null;         // (추가 제안)
}
```

### 핵심 포인트 분류

| category | 화면 이름 | 예시 title |
|---|---|---|
| `performance` | 실적 특징 | 3년 동안 매출과 이익이 함께 늘었어요 |
| `revenue_source` | 주요 수익원 | 가장 많이 버는 곳은 반도체(DS) 사업이에요 |
| `recent_change` | 최근 실적 변화 | 작년보다 영업이익이 약 33% 늘었어요 |
| `risk` | 위험·변화 요인 | 반도체 경기에 따라 이익이 크게 흔들릴 수 있어요 |
| `strength` | 핵심 경쟁력 | AI용 메모리(HBM)를 만드는 기술이 경쟁력이에요 |

`before`와 `after`는 하나만 있어도 돼요. 둘 다 `null`이면 화면에서 "과거 → 현재" 줄을 생략해요.

## 4. 원래 제안에 프론트가 덧붙인 필드

| 필드 | 이유 |
|---|---|
| `evidence.financials.base_date`, `evidence.vision.base_date` | 피드백에서 근거마다 "출처·기준일"을 표시하기로 했는데, 원래 제안에는 기준일 필드가 없어요 |
| `highlights[].is_sample` | 확인 전인 값(예: 부채비율)에 "예시 값" 배지를 붙이기 위해서예요 |
| `failure_reason` | 실패 화면에 원인 문구를 보여주기 위해서예요 (예: "재무제표를 불러오지 못했어요") |

모두 optional이라 빠져도 화면은 동작해요.

## 5. 프론트 기본안 (바꾸려면 PR 코멘트로)

| # | 항목 | 프론트 기본안 |
|---|---|---|
| 1 | 리포트가 없을 때 | `200` + `status: "none"`. 404도 "none"으로 처리해 둠 (단, `code: "COMPANY_NOT_FOUND"`인 404는 에러) |
| 2 | 생성 중·실패 시 `GET` 응답 | 위 2장 표 규칙 (이전 내용 유지) |
| 3 | 생성 진행 단계 | 서버는 보내지 않아도 됨. 프론트가 경과 시간(약 15초 기준)으로 4단계를 표시. 나중에 `progress_step` 필드를 추가하면 그걸 쓰도록 바꿀 수 있음 |
| 4 | 생성 취소 | MVP에서는 API 없음. 프론트 "취소"는 기다리기만 멈춤 |
| 5 | 배열 형식 | `years`, `revenue`, `operating_income`는 같은 순서·같은 길이로 보내 주세요 |
| 6 | 뉴스 `url` | 필수. 원문 링크가 없는 뉴스는 빼고 보내 주세요 |
| 7 | 면책 문구 | 리포트에 넣지 않음. 프론트 고정 문구 |
| 8 | 핵심 포인트 개수 | 5개, 분류별 1개씩. 순서는 프론트가 정렬하지만 이 순서로 보내 주면 좋아요 |

## 6. 예시 (삼성전자, 확인된 수치만)

전체 예시는 `frontend/src/mocks/samsungElectronics.json`의 `report`에 있어요. 아래는 일부예요.

```json
{
  "stock_code": "005930",
  "status": "done",
  "generated_at": "2026-10-06T09:00:00+09:00",
  "headline": "AI용 메모리가 잘 팔리면서 3년 만에 이익이 크게 늘어난 회사예요",
  "key_points": [
    {
      "category": "performance",
      "title": "3년 동안 매출과 이익이 함께 늘었어요",
      "before": { "label": "영업이익", "value": "6.57조 원", "period": "2023" },
      "after": { "label": "영업이익", "value": "43.6조 원", "period": "2025" },
      "reason": "2023년에는 반도체 가격이 떨어져 이익이 크게 줄었어요. 2024년부터 메모리 반도체가 다시 잘 팔리면서 이익이 회복됐어요.",
      "meaning": "매출(258.94조 → 333.6조 원)보다 이익이 훨씬 빠르게 늘어서, 팔아서 남기는 돈이 많아졌다는 뜻이에요.",
      "evidence": ["financials"]
    }
  ],
  "evidence": {
    "financials": {
      "unit": "조 원",
      "years": ["2023", "2024", "2025"],
      "revenue": [258.94, 300.9, 333.6],
      "operating_income": [6.57, 32.7, 43.6],
      "highlights": [
        { "label": "매출", "value": "333.6조 원", "source": "삼성전자 공식 실적 발표 (2026년 1월)" },
        { "label": "부채비율", "value": "27.1%", "source": "예시 값 (확인 예정)", "is_sample": true }
      ],
      "base_date": "2025년 연간 · 연결 기준"
    },
    "news": [],
    "vision": {
      "summary": "스마트폰부터 AI 서버용 반도체까지 만드는 회사예요.",
      "revenue_mix": [
        { "name": "DS(반도체)", "amount": 44.0, "unit": "조 원", "period": "2025년 4분기" },
        { "name": "MX·네트워크(스마트폰 등)", "amount": 29.3, "unit": "조 원", "period": "2025년 4분기" },
        { "name": "SDC(디스플레이)", "amount": 9.5, "unit": "조 원", "period": "2025년 4분기" },
        { "name": "하만(전장·오디오)", "amount": 4.6, "unit": "조 원", "period": "2025년 4분기" }
      ],
      "source": "삼성전자 2025년 4분기 실적 발표",
      "base_date": "2026년 1월"
    }
  },
  "quiz": [],
  "sources": ["금융감독원 DART", "한국거래소", "삼성전자 실적 발표"],
  "failure_reason": null
}
```

## 7. 관련 API

리포트 외에 프론트가 부르는 모든 API는 [`API_SPEC.md`](./API_SPEC.md)에 정리했어요.
