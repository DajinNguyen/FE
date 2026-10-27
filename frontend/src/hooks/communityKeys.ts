import type { PostCategory, PostSort } from '../types';

/**
 * 커뮤니티 쿼리 키. 맨 앞에 "보는 사람"을 넣어서, 로그인·로그아웃하면
 * 좋아요 여부·내 글 여부를 새로 받아와요.
 */
export const communityKeys = {
  all: (viewer: string) => ['community', viewer] as const,
  posts: (viewer: string, stockCode: string) => ['community', viewer, 'posts', stockCode] as const,
  postList: (viewer: string, stockCode: string, sort: PostSort, category?: PostCategory) =>
    ['community', viewer, 'posts', stockCode, sort, category ?? 'all'] as const,
  post: (viewer: string, postId: string) => ['community', viewer, 'post', postId] as const,
  comments: (viewer: string, postId: string) => ['community', viewer, 'comments', postId] as const,
};
