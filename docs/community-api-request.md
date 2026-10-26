# 커뮤니티 API 요청서 (프론트 → 백엔드)

> 작성: 프론트엔드 · 2026-10-26
> 기업 상세의 커뮤니티(기업별 게시판) 화면을 목 데이터로 먼저 만들어 뒀어요. 아래 형식으로 API를 만들어 주시면 `VITE_USE_MOCK=false` 로 바로 연동돼요.
> 타입 원본: `frontend/src/types/community.ts` · 프론트 함수: `frontend/src/api/community.ts` · 규칙 값: `frontend/src/config/communityRules.ts`

## 1. 화면과 권한

| 화면 | 주소 | 로그인 |
|---|---|---|
| 글 목록 (기업 상세 > 커뮤니티 탭) | `/companies/{stock_code}?tab=community` | 보기는 필요 없음 |
| 글 보기 | `/companies/{stock_code}/community/{post_id}` | 보기는 필요 없음 |
| 글쓰기 · 수정 | `.../community/write`, `.../community/edit/{post_id}` | 필요 |
| 댓글 쓰기 · 지우기, 좋아요, 신고, 글 지우기 | — | 필요 |

로그인은 Google 로그인 후 쿠키(JWT)로 알아본다고 가정했어요. 프론트 요청은 `credentials: 'include'` 로 쿠키를 함께 보내요.

## 2. API 목록

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

## 3. 응답 형식

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

## 4. 서버에서 지켜야 할 규칙

프론트도 같은 검사를 하지만, 프론트 검사는 쉽게 우회되니 **서버에서 반드시 한 번 더** 검사해 주세요.

| 규칙 | 값 | 어길 때 |
|---|---|---|
| 제목 글자 수 | 1~50자 (앞뒤 공백 제거 후) | `400 INVALID_LENGTH` |
| 본문 글자 수 | 1~2,000자 | `400 INVALID_LENGTH` |
| 댓글 글자 수 | 1~500자 | `400 INVALID_LENGTH` |
| 금지어 | 욕설, "리딩방", 오픈채팅·텔레그램 링크, "수익 보장"·"종목 추천" 류 (띄어쓰기 무시) | `400 BANNED_WORD` |
| 도배 방지 | 같은 사람은 글을 30초에 한 번 | `429 TOO_FREQUENT` |
| 신고 | 같은 사람은 같은 대상을 한 번만 | `409 ALREADY_REPORTED` |
| 신고 숨김 | 서로 다른 사람의 신고가 **3건** 쌓이면 자동 숨김 (`is_hidden: true`) | — |
| 수정·삭제 | 작성자 본인만 | `403 NOT_OWNER` |
| 로그인 필요 | 쓰기·수정·삭제·댓글·좋아요·신고 | `401 LOGIN_REQUIRED` |
| 없는 글 | — | `404 POST_NOT_FOUND` |

- 금지어 목록 시작점: `frontend/src/config/communityRules.ts` 의 `bannedRules`. 최종 목록은 PM과 정해 주세요.
- 글을 지우면 그 글의 댓글도 함께 지워 주세요.

## 5. 에러 응답 형식

```json
{ "error": { "code": "TOO_FREQUENT", "message": "글은 30초에 한 번만 쓸 수 있어요. 잠시 후 다시 시도해 주세요" } }
```

`message` 는 화면에 그대로 보여줄 수 있는 쉬운 문장으로 주세요. (글쓰기 화면의 안내, 토스트에 나와요)

## 6. 연동 확인 방법

1. `frontend/.env`
   ```
   VITE_USE_MOCK=false
   VITE_API_BASE_URL=http://localhost:8000
   ```
2. `npm run dev` 후 `http://localhost:5173/companies/005930?tab=community`
3. 확인 순서: 목록(최신순·인기순·말머리) → 글 보기 → 로그인 → 글쓰기 → 댓글 → 좋아요 → 신고
4. 실제 API 모드에서는 개발용 가짜 로그인 버튼이 사라져요. Google 로그인(`AuthProvider` 의 `loginWithGoogle`)을 먼저 연결해야 쓰기 기능을 확인할 수 있어요.

## 7. 확인이 필요한 것

1. 닉네임은 어떻게 정할지 (가입 때 직접 / 자동 생성)
2. 신고로 숨긴 글을 누가 다시 확인하고 되살리는지 (관리자 화면은 이번 범위 밖)
3. 금지어 최종 목록과 갱신 방법
4. 좋아요 수가 많을 때 인기순 기간 (전체 기간 / 최근 7일)
