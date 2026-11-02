import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { createPost, deletePost, likePost, unlikePost, updatePost } from '../api/community';
import type { Post, PostInput, PostPage } from '../types';
import { communityKeys } from './communityKeys';
import { useToast } from './useToast';
import { useViewerId } from './useViewerId';

/** 글쓰기·수정·삭제와 좋아요 (좋아요는 먼저 화면에 반영하고 실패하면 되돌려요) */
export function usePostMutations(stockCode: string) {
  const queryClient = useQueryClient();
  const viewer = useViewerId();
  const { showToast } = useToast();
  const listKey = communityKeys.posts(viewer, stockCode);

  const refreshLists = () => queryClient.invalidateQueries({ queryKey: listKey });

  const create = useMutation({
    mutationFn: (input: PostInput) => createPost(stockCode, input),
    onSuccess: (post) => {
      queryClient.setQueryData(communityKeys.post(viewer, post.id), post);
      void refreshLists();
    },
  });

  const update = useMutation({
    mutationFn: ({ postId, input }: { postId: string; input: PostInput }) =>
      updatePost(postId, input),
    onSuccess: (post) => {
      queryClient.setQueryData(communityKeys.post(viewer, post.id), post);
      void refreshLists();
    },
  });

  const remove = useMutation({
    mutationFn: (postId: string) => deletePost(postId),
    onSuccess: (_, postId) => {
      queryClient.removeQueries({ queryKey: communityKeys.post(viewer, postId) });
      void refreshLists();
    },
  });

  /** 글 화면과 목록 화면에 있는 같은 글을 함께 바꿔요. */
  const patchPost = (postId: string, patch: (post: Post) => Post) => {
    queryClient.setQueryData<Post>(communityKeys.post(viewer, postId), (old) =>
      old ? patch(old) : old,
    );
    queryClient.setQueriesData<InfiniteData<PostPage>>({ queryKey: listKey }, (old) =>
      old
        ? {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((p) => (p.id === postId ? patch(p) : p)),
            })),
          }
        : old,
    );
  };

  const toggleLike = useMutation({
    mutationFn: (post: Post) => (post.liked_by_me ? unlikePost(post.id) : likePost(post.id)),
    onMutate: async (post) => {
      await queryClient.cancelQueries({ queryKey: communityKeys.all(viewer) });
      const before = { liked_by_me: post.liked_by_me, like_count: post.like_count };
      patchPost(post.id, (p) => ({
        ...p,
        liked_by_me: !before.liked_by_me,
        like_count: before.like_count + (before.liked_by_me ? -1 : 1),
      }));
      return before;
    },
    onError: (_error, post, before) => {
      if (before) patchPost(post.id, (p) => ({ ...p, ...before }));
      showToast('좋아요를 반영하지 못했어요. 잠시 후 다시 시도해 주세요.');
    },
    onSuccess: (result, post) => patchPost(post.id, (p) => ({ ...p, ...result })),
    // 로그인하면서 누른 경우 보는 사람이 바뀌어 다른 쿼리가 화면에 있어요. 끝나면 서버 값으로 다시 맞춰요.
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['community'] }),
  });

  return { create, update, remove, toggleLike };
}
