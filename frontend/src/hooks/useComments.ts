import { displayName } from '../features/auth/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createComment, deleteComment, getComments } from '../api/community';
import type { Comment, CommentInput, Post } from '../types';
import { useAuth } from './useAuth';
import { communityKeys } from './communityKeys';
import { useToast } from './useToast';
import { useViewerId } from './useViewerId';

/** 댓글·답글 목록과 쓰기·지우기. 쓰기는 먼저 화면에 보여주고 실패하면 되돌려요. */
export function useComments(postId: string) {
  const queryClient = useQueryClient();
  const viewer = useViewerId();
  const { user } = useAuth();
  const { showToast } = useToast();
  const key = communityKeys.comments(viewer, postId);
  const postKey = communityKeys.post(viewer, postId);

  const query = useQuery({
    queryKey: key,
    queryFn: () => getComments(postId),
    // 로그인해서 보는 사람이 바뀌어도 같은 글의 댓글은 그대로 두고 새로 받아요.
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[3] === postId ? previous : undefined,
  });

  const bumpCount = (delta: number) =>
    queryClient.setQueryData<Post>(postKey, (old) =>
      old ? { ...old, comment_count: Math.max(0, old.comment_count + delta) } : old,
    );

  const create = useMutation({
    mutationFn: (input: CommentInput) => createComment(postId, input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: key });
      const before = queryClient.getQueryData<Comment[]>(key);
      const temp: Comment = {
        id: `temp-${Date.now()}`,
        post_id: postId,
        body: input.body,
        parent_id: input.parent_id ?? null,
        reply_to_nickname: input.reply_to_nickname ?? null,
        image_url: input.image_url ?? null,
        author: { id: user?.id ?? 'me', nickname: user ? displayName(user) : '나' },
        created_at: new Date().toISOString(),
        is_mine: true,
        is_hidden: false,
      };
      queryClient.setQueryData<Comment[]>(key, (old) => [...(old ?? []), temp]);
      bumpCount(1);
      return { before, tempId: temp.id };
    },
    onError: (error, _input, context) => {
      queryClient.setQueryData(key, context?.before);
      bumpCount(-1);
      showToast(error instanceof Error ? error.message : '댓글을 남기지 못했어요.');
    },
    onSuccess: (comment, _input, context) =>
      queryClient.setQueryData<Comment[]>(key, (old) =>
        (old ?? []).map((c) => (c.id === context?.tempId ? comment : c)),
      ),
    // 로그인하면서 쓴 경우 보는 사람이 바뀌어 다른 쿼리가 화면에 있어요. 끝나면 서버 값으로 다시 맞춰요.
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['community'] }),
  });

  const remove = useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onSuccess: (_, commentId) => {
      // 답글이 있는 댓글은 "삭제된 댓글이에요"로 자리를 남겨요.
      queryClient.setQueryData<Comment[]>(key, (old) => {
        const list = old ?? [];
        const hasReplies = list.some((c) => c.parent_id === commentId);
        return hasReplies
          ? list.map((c) => (c.id === commentId ? { ...c, body: '', is_deleted: true } : c))
          : list.filter((c) => c.id !== commentId);
      });
      bumpCount(-1);
    },
    onError: () => showToast('댓글을 지우지 못했어요.'),
  });

  return { ...query, comments: query.data ?? [], create, remove };
}
