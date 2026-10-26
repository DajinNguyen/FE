import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createComment, deleteComment, getComments } from '../api/community';
import type { Comment, Post } from '../types';
import { useAuth } from './useAuth';
import { communityKeys } from './communityKeys';
import { useToast } from './useToast';
import { useViewerId } from './useViewerId';

/** 댓글 목록과 쓰기·지우기. 쓰기는 먼저 화면에 보여주고 실패하면 되돌려요. */
export function useComments(postId: string) {
  const queryClient = useQueryClient();
  const viewer = useViewerId();
  const { user } = useAuth();
  const { showToast } = useToast();
  const key = communityKeys.comments(viewer, postId);
  const postKey = communityKeys.post(viewer, postId);

  const query = useQuery({ queryKey: key, queryFn: () => getComments(postId) });

  const bumpCount = (delta: number) =>
    queryClient.setQueryData<Post>(postKey, (old) =>
      old ? { ...old, comment_count: Math.max(0, old.comment_count + delta) } : old,
    );

  const create = useMutation({
    mutationFn: (body: string) => createComment(postId, body),
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey: key });
      const before = queryClient.getQueryData<Comment[]>(key);
      const temp: Comment = {
        id: `temp-${Date.now()}`,
        post_id: postId,
        body,
        author: { id: user?.id ?? 'me', nickname: user?.nickname ?? '나' },
        created_at: new Date().toISOString(),
        is_mine: true,
        is_hidden: false,
      };
      queryClient.setQueryData<Comment[]>(key, (old) => [...(old ?? []), temp]);
      bumpCount(1);
      return { before, tempId: temp.id };
    },
    onError: (error, _body, context) => {
      queryClient.setQueryData(key, context?.before);
      bumpCount(-1);
      showToast(error instanceof Error ? error.message : '댓글을 남기지 못했어요.');
    },
    onSuccess: (comment, _body, context) =>
      queryClient.setQueryData<Comment[]>(key, (old) =>
        (old ?? []).map((c) => (c.id === context?.tempId ? comment : c)),
      ),
  });

  const remove = useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onSuccess: (_, commentId) => {
      queryClient.setQueryData<Comment[]>(key, (old) =>
        (old ?? []).filter((c) => c.id !== commentId),
      );
      bumpCount(-1);
    },
    onError: () => showToast('댓글을 지우지 못했어요.'),
  });

  return { ...query, comments: query.data ?? [], create, remove };
}
