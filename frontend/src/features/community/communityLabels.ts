import type { PostCategory, ReportReason } from '../../types';

export const categoryLabels: Record<PostCategory, string> = {
  question: '질문',
  analysis: '분석 공유',
  news: '뉴스',
  free: '자유',
};

export const postCategories = Object.keys(categoryLabels) as PostCategory[];

export const reportReasonLabels: Record<ReportReason, string> = {
  solicitation: '투자 권유·리딩방',
  abuse: '욕설·비방',
  ad: '광고',
  privacy: '개인정보 노출',
  etc: '기타',
};

export const reportReasons = Object.keys(reportReasonLabels) as ReportReason[];

/** 커뮤니티 화면 주소 */
export const communityPaths = {
  list: (stockCode: string) => `/companies/${stockCode}?tab=community`,
  post: (stockCode: string, postId: string) => `/companies/${stockCode}/community/${postId}`,
  write: (stockCode: string) => `/companies/${stockCode}/community/write`,
  edit: (stockCode: string, postId: string) => `/companies/${stockCode}/community/edit/${postId}`,
};

export const HIDDEN_POST_TEXT = '신고로 숨겨진 글이에요';
export const HIDDEN_COMMENT_TEXT = '신고로 숨겨진 댓글이에요';
