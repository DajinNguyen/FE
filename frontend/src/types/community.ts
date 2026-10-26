/** 커뮤니티 (기업별 게시판) */

/** 말머리: 질문 / 분석 공유 / 뉴스 / 자유 */
export type PostCategory = 'question' | 'analysis' | 'news' | 'free';

/** 정렬: 최신순 / 인기순(좋아요) */
export type PostSort = 'latest' | 'popular';

/** 신고 사유: 투자 권유·리딩방 / 욕설·비방 / 광고 / 개인정보 노출 / 기타 */
export type ReportReason = 'solicitation' | 'abuse' | 'ad' | 'privacy' | 'etc';

export interface Author {
  id: string;
  /** 실명 대신 닉네임 */
  nickname: string;
}

export interface Post {
  id: string;
  stock_code: string;
  category: PostCategory;
  title: string;
  /** 본문. 숨김 처리된 글은 빈 문자열 */
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
  /** 숨김 처리된 댓글은 빈 문자열 */
  body: string;
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

/** 글쓰기·수정 요청 */
export interface PostInput {
  category: PostCategory;
  title: string;
  body: string;
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
