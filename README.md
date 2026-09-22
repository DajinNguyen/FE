# 다진(dajin) — Frontend

주식 초보자를 위한 기업별 분석 리포트 서비스 **다진(dajin)**의 프론트엔드 저장소입니다.

## 소개

주식을 처음 시작하는 초보 투자자(10대 포함)가 관심 기업을 검색하면, 백엔드가 제공하는
재무제표·시세·AI 분석 리포트를 초보자 친화적인 화면으로 보여주는 것이 이 저장소의 역할입니다.
전문 용어 대신 쉬운 말로 풀어쓴 설명을 우선합니다.

## 주요 역할

- 기업 검색 UI
- 리포트 결과 화면 시각화 (초보자 친화적 구성)
- 백엔드 API 연동 (재무제표/시세/AI 리포트 데이터 조회)

## 기술 스택

| 영역 | 선택 |
|---|---|
| 프레임워크 | React + TypeScript + Vite |
| 데이터 페칭 | TanStack Query |
| 테스트 | Vitest + React Testing Library |
| 린트/포맷 | ESLint + Prettier |

## 폴더 구조

```
frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   └── api/          # API 클라이언트 함수 (컴포넌트에서 직접 fetch 금지)
└── tests/
```

## 코딩 컨벤션

- 컴포넌트 파일/컴포넌트명: `PascalCase`
- 그 외 함수/변수: `camelCase`
- 커스텀 훅: `use` 접두사 (예: `useCompanyReport`)
- API 호출은 `src/api/` 아래 함수로만 수행

## 실행 방법

```
npm install
npm run dev
```

## 관련 저장소

- Backend: [DajinNguyen/BE](https://github.com/DajinNguyen/BE)
