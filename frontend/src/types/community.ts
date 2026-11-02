/** 커뮤니티 (기업별 게시판) */

/** 말머리: 질문 / 분석 공유 / 뉴스 / 자유 */
export type PostCategory = 'question' | 'analysis' | 'news' | 'free';

/** 정렬: 최신순 / 인기순(좋아요) */
export type PostSort = 'latest' | 'popular';

/** 신고 사유: 투자 권유·리딩방 / 욕설·비방 / 광고 / 개인정보 노출 / 부적절한 사진 / 기타 */
export type ReportReason = 'solicitation' | 'abuse' | 'ad' | 'privacy' | 'image' | 'etc';

export interface Author {
  id: string;
  /** 실명 대신 닉네임 */
  nickname: string;
}

export interface Post {
  id: string;
  stock_code: string;
  category: PostCategory;
  /** 본문 (제목 없이 본문만, 최대 2,000자). 숨김 처리된 글은 빈 문자열. 서버가 title 을 보내도 쓰지 않아요. */
  body: string;
  author: Author;
  created_at: string;
  updated_at: string | null;
  like_count: number;
  comment_count: number;
  /** 아래 네 칸은 지금 보는 사람 기준이에요. (비로그인이면 false) */
  liked_by_me: boolean;
  reported_by_me: boolean;
  is_mine: boolean;
  /** 신고가 쌓여 숨겨진 글이면 true → "신고로 숨겨진 글이에요" */
  is_hidden: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  /** 숨김 처리된 댓글은 빈 문자열. 다진 이모지는 ":dajin-아이디:" 로 들어 있어요. */
  body: string;
  /** (2026-11-02 추가 요청) 답글이면 원댓글 id. 답글은 한 단계만이라 답글의 답글도 원댓글 id 예요. */
  parent_id?: string | null;
  /** (추가 요청) 답글의 답글이면 대상 닉네임 → "@닉네임" 으로 보여줘요 */
  reply_to_nickname?: string | null;
  /** (추가 요청) 원댓글에 달린 답글 수 */
  reply_count?: number;
  /** (추가 요청) 지웠지만 답글이 있어 자리만 남은 댓글 → "삭제된 댓글이에요" */
  is_deleted?: boolean;
  /** (추가 요청) 첨부 사진 주소 (POST /api/uploads 응답의 image_url) */
  image_url?: string | null;
  author: Author;
  created_at: string;
  is_mine: boolean;
  is_hidden: boolean;
}

/** GET /api/companies/{stock_code}/posts 응답 */
export interface PostPage {
  items: Post[];
  page: number;
  has_next: boolean;
}

/** 기업 댓글(=글) 쓰기 요청: 말머리 + 본문 (+ 사진, 업로드 API 준비 후) */
export interface PostInput {
  category: PostCategory;
  body: string;
  image_url?: string | null;
}

/** 댓글·답글 쓰기 요청 */
export interface CommentInput {
  body: string;
  parent_id?: string | null;
  reply_to_nickname?: string | null;
  image_url?: string | null;
}

/** 신고 요청 */
export interface ReportInput {
  target_type: 'post' | 'comment';
  target_id: string;
  reason: ReportReason;
}

/** 좋아요 요청 응답 */
export interface LikeResult {
  like_count: number;
  liked_by_me: boolean;
}
