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
    // 로그인해서 보는 사람이 바뀌어도 같은 기업·정렬이면 목록을 두고 새로 받아요. (열어 둔 답글 입력창이 닫히지 않게)
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[3] === stockCode && previousQuery?.queryKey[4] === sort
        ? previous
        : undefined,
  });
  return { ...query, posts: query.data?.pages.flatMap((p) => p.items) ?? [] };
}
