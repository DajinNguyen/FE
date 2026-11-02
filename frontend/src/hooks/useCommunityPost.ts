import { useQuery } from '@tanstack/react-query';
import { getPost } from '../api/community';
import { communityKeys } from './communityKeys';
import { useViewerId } from './useViewerId';

export function useCommunityPost(postId: string) {
  const viewer = useViewerId();
  return useQuery({
    queryKey: communityKeys.post(viewer, postId),
    queryFn: () => getPost(postId),
  });
}
