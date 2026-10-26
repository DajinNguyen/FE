# 로그인(Google) API 요청서 (프론트 → 백엔드)

> 작성: 프론트엔드 · 2026-10-26
> 프론트는 로그인 연동 준비를 마쳤어요. 아래 API 4개가 생기면 `VITE_USE_MOCK=false` 로 바로 연결돼요.
> 프론트 함수: `frontend/src/api/auth.ts` · 로그인 상태: `frontend/src/features/auth/AuthProvider.tsx` · 타입: `frontend/src/types/auth.ts`

## 1. 로그인 흐름

```
[Google로 로그인] 클릭
  → 브라우저가 백엔드로 이동: GET /api/auth/google/login?redirect=/companies/005930?tab=community
  → 백엔드가 Google 로그인 화면으로 보냄
  → Google 이 백엔드 콜백으로 돌려보냄: GET /api/auth/google/callback?code=...
  → 백엔드가 사용자 확인·가입 처리 후 로그인 쿠키(JWT)를 심고, redirect 주소(프론트 화면)로 302 이동
  → 프론트가 다시 열리면서 GET /api/auth/me 로 사용자 정보를 받아요
```

- 토큰은 **쿠키로만** 주고받아요. 프론트는 토큰을 직접 읽거나 저장하지 않아요. (localStorage 저장 X)
- 프론트의 모든 요청은 `credentials: 'include'` 로 쿠키를 함께 보내요.

## 2. API 목록

| 기능 | 요청 | 성공 응답 |
|---|---|---|
| 로그인 시작 | `GET /api/auth/google/login?redirect={프론트 경로}` | `302` → Google 로그인 화면 |
| 로그인 콜백 | `GET /api/auth/google/callback` (Google 이 호출) | 쿠키 설정 + `302` → `{프론트 주소}{redirect}` |
| 내 정보 | `GET /api/auth/me` | `200` + `AuthUser` / 로그인 안 됨 `401` |
| 로그아웃 | `POST /api/auth/logout` | `204` + 쿠키 삭제 |

### `AuthUser`

```json
{
  "id": "u-123",
  "email": "student@example.com",
  "name": "김다진",
  "nickname": "주린이"
}
```

| 칸 | 설명 |
|---|---|
| `id` | 사용자 고유 값. 커뮤니티의 `author.id` 와 같은 값이어야 해요 ("내 글" 판단) |
| `email`, `name` | Google 에서 받은 값. **이 두 가지만** 받아요 (scope: `openid email profile`) |
| `nickname` | 커뮤니티·상단 메뉴에 보이는 이름. 실명 대신 써요 (10대 사용자 보호) |

## 3. 꼭 지켜 주세요

1. **redirect 검사 (열린 리디렉션 막기)**: `/` 로 시작하는 우리 사이트 안 경로만 받아 주세요. `//evil.com`, `https://...` 처럼 바깥 주소면 `/` 로 보내요.
2. **쿠키 설정**: `HttpOnly`, `Secure`(배포 환경), `SameSite=Lax`, `Path=/`. 만료는 팀에서 정해 주세요 (예: 7일).
3. **로그인 실패**: 사용자가 취소하거나 실패하면 redirect 주소에 `login_error` 를 붙여서 돌려보내 주세요.
   - `?login_error=cancelled` → 화면: "로그인을 취소했어요."
   - `?login_error=failed` → 화면: "Google 로그인에 실패했어요. 잠시 후 다시 시도해 주세요."
4. **만료된 쿠키**: 로그인이 필요한 API 는 `401` + `{ "error": { "code": "LOGIN_REQUIRED", "message": "로그인이 필요해요" } }` 로 주세요. 프론트는 401 을 받으면 로그아웃 상태로 바꿔요.
5. **Google 클라이언트 비밀값은 서버에만** 두세요. 프론트에는 어떤 키도 필요 없어요.

## 4. 개발 환경 (프론트 5173 · 백엔드 8000)

- 포트만 다른 `localhost` 는 같은 사이트라서 `SameSite=Lax` 쿠키가 함께 가요.
- 대신 CORS 설정이 필요해요: `allow_origins=["http://localhost:5173"]`, `allow_credentials=True` (`*` 는 쿠키와 같이 못 써요).
- 로그인 콜백 후 돌아갈 프론트 주소(예: `FRONTEND_URL=http://localhost:5173`)는 백엔드 환경 변수로 두면 편해요.
- 배포에서는 Nginx 가 같은 도메인으로 묶어서 CORS 가 필요 없어요.

## 5. 연동 확인 방법

1. `frontend/.env`
   ```
   VITE_USE_MOCK=false
   VITE_API_BASE_URL=http://localhost:8000
   ```
2. `npm run dev` → `http://localhost:5173/companies/005930?tab=community`
3. 상단 [Google로 로그인] → Google 로그인 → **같은 화면으로 돌아와서** 상단에 "닉네임님"이 보이면 성공
4. 새로고침해도 로그인이 유지되는지, [로그아웃] 후 새로고침하면 로그아웃 상태인지 확인
5. 개발자 도구 > 네트워크에서 `/api/auth/me` 요청에 쿠키가 실려 가는지 확인

## 6. 프론트에서 이미 해 둔 것

- 실제 API 모드에서는 [개발용 로그인] 버튼이 사라져요.
- 처음 열 때 `/api/auth/me` 를 확인하는 동안은 로그인 버튼과 글쓰기 화면을 잠깐 비워 둬요 (깜빡임 방지).
- 로그인이 필요한 동작(글쓰기·댓글·좋아요·신고)은 로그인 안내 시트를 띄워요. Google 로그인은 페이지를 이동하므로, 돌아온 뒤에 그 동작을 한 번 더 눌러야 해요.

## 7. 확인이 필요한 것

1. 닉네임: 첫 로그인 때 직접 정하게 할지, 자동으로 만들지 (직접 정하면 닉네임 설정 화면·API 가 더 필요해요)
2. 쿠키 만료 기간과 자동 연장 여부
3. `CLAUDE.md` 에는 "이메일/비밀번호 JWT"로 적혀 있는데, Google 로그인으로 바꾸는 걸로 확정인지 (문서도 같이 고쳐야 해요)
