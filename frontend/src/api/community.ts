import { request } from './client';
import type {
  Comment,
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
    body: input,
  });
}

export function updatePost(postId: string, input: PostInput) {
  return request<Post>({
    path: `/api/posts/${postId}`,
    method: 'PUT',
    body: input,
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

export function createComment(postId: string, body: string) {
  return request<Comment>({
    path: `/api/posts/${postId}/comments`,
    method: 'POST',
    body: { body },
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
