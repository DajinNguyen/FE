import { useQuery } from '@tanstack/react-query';
import { getPost } from '../api/community';
import { communityKeys } from './communityKeys';
import { useViewerId } from './useViewerId';

/** enabled 가 false 면 불러오지 않아요. (글쓰기 화면처럼 글이 아직 없을 때) */
export function useCommunityPost(postId: string, { enabled = true } = {}) {
  const viewer = useViewerId();
  return useQuery({
    queryKey: communityKeys.post(viewer, postId),
    queryFn: () => getPost(postId),
    enabled,
  });
}
