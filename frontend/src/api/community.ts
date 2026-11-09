import { request } from './client';
import type {
  Comment,
  CommentInput,
  LikeResult,
  Post,
  PostCategory,
  PostInput,
  PostPage,
  PostSort,
  ReportInput,
} from '../types';

export interface PostQuery {
  sort: PostSort;
  /** 없으면 전체 */
  category?: PostCategory;
  page: number;
}

export const POST_PAGE_SIZE = 10;

/**
 * ⚠️ 임시: 백엔드가 아직 title 을 필수로 받아서, 본문 첫 줄(30자)을 제목으로 채워 보내요.
 * 백엔드가 title 을 빼면 이 함수와 아래 withTitle 만 지우면 돼요.
 */
const withTitle = (input: PostInput) => ({
  ...input,
  title: input.body.trim().split('\n')[0].slice(0, 30),
});

/** 기업 커뮤니티 글 목록 */
export function getPosts(stockCode: string, { sort, category, page }: PostQuery) {
  const params = new URLSearchParams({ sort, page: String(page), size: String(POST_PAGE_SIZE) });
  if (category) params.set('category', category);
  return request<PostPage>({
    path: `/api/companies/${stockCode}/posts?${params}`,
  });
}

export function getPost(postId: string) {
  return request<Post>({
    path: `/api/posts/${postId}`,
  });
}

export function createPost(stockCode: string, input: PostInput) {
  return request<Post>({
    path: `/api/companies/${stockCode}/posts`,
    method: 'POST',
    body: withTitle(input),
  });
}

export function deletePost(postId: string) {
  return request<void>({
    path: `/api/posts/${postId}`,
    method: 'DELETE',
  });
}

export function getComments(postId: string) {
  return request<Comment[]>({
    path: `/api/posts/${postId}/comments`,
  });
}

/** 댓글·답글 쓰기. 답글은 parent_id 를 같이 보내요. (서버가 아직 parent_id 를 모르면 일반 댓글로 저장돼요) */
export function createComment(postId: string, input: CommentInput) {
  return request<Comment>({
    path: `/api/posts/${postId}/comments`,
    method: 'POST',
    body: input,
  });
}

export function deleteComment(commentId: string) {
  return request<void>({
    path: `/api/comments/${commentId}`,
    method: 'DELETE',
  });
}

export function likePost(postId: string) {
  return request<LikeResult>({
    path: `/api/posts/${postId}/like`,
    method: 'POST',
  });
}

export function unlikePost(postId: string) {
  return request<LikeResult>({
    path: `/api/posts/${postId}/like`,
    method: 'DELETE',
  });
}

/** 글·댓글 신고 (같은 대상은 한 번만) */
export function reportTarget(input: ReportInput) {
  return request<void>({
    path: '/api/reports',
    method: 'POST',
    body: input,
  });
}
