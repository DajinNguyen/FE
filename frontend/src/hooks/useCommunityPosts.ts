import { useInfiniteQuery } from '@tanstack/react-query';
import { getPosts } from '../api/community';
import type { PostCategory, PostSort } from '../types';
import { communityKeys } from './communityKeys';
import { useViewerId } from './useViewerId';

/** 기업 커뮤니티 글 목록. [더 보기]로 다음 페이지를 이어 붙여요. */
export function useCommunityPosts(stockCode: string, sort: PostSort, category?: PostCategory) {
  const viewer = useViewerId();
  const query = useInfiniteQuery({
    queryKey: communityKeys.postList(viewer, stockCode, sort, category),
    queryFn: ({ pageParam }) => getPosts(stockCode, { sort, category, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.has_next ? last.page + 1 : undefined),
  });
  return { ...query, posts: query.data?.pages.flatMap((p) => p.items) ?? [] };
}
