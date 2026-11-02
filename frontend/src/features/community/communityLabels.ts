import type { ReportReason } from '../../types';

export const reportReasonLabels: Record<ReportReason, string> = {
  solicitation: '투자 권유·리딩방',
  abuse: '욕설·비방',
  ad: '광고',
  privacy: '개인정보 노출',
  image: '부적절한 사진',
  etc: '기타',
};

export const reportReasons = Object.keys(reportReasonLabels) as ReportReason[];

export const HIDDEN_COMMENT_TEXT = '신고로 숨겨진 댓글이에요';
export const DELETED_COMMENT_TEXT = '삭제된 댓글이에요';
