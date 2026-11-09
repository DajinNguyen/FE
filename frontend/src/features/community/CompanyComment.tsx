import { useState } from 'react';
import { Icon } from '../../components/Icon';
import { usePostMutations } from '../../hooks/usePostMutations';
import { useRequireLogin } from '../../hooks/useRequireLogin';
import { useToast } from '../../hooks/useToast';
import type { Post } from '../../types';
import { formatRelativeTime } from '../../utils/format';
import { CommentBody } from './CommentBody';
import { HIDDEN_COMMENT_TEXT } from './communityLabels';
import { ReplyList } from './ReplyList';
import { ReportSheet } from './ReportSheet';
import styles from './Comment.module.css';

/**
 * 기업 커뮤니티의 댓글 한 개 (서버에서는 "글"로 저장돼요) + 답글.
 * 답글은 접혀 있다가 "답글 N개 보기"로 펼쳐요.
 */
export function CompanyComment({ post, stockCode }: { post: Post; stockCode: string }) {
  const requireLogin = useRequireLogin();
  const { showToast } = useToast();
  const { toggleLike, remove } = usePostMutations(stockCode);
  const [open, setOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<{ nickname: string | null } | null>(null);
  const [reporting, setReporting] = useState(false);

  if (post.is_hidden) return <p className={styles.muted}>{HIDDEN_COMMENT_TEXT}</p>;

  const startReply = (nickname: string | null) => {
    setOpen(true);
    setReplyTo({ nickname });
  };

  return (
    <div className={styles.item}>
      <p className={styles.meta}>
        <strong>{post.author.nickname}</strong> · {formatRelativeTime(post.created_at)}
      </p>
      <CommentBody body={post.body} imageUrl={post.image_url} />
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.likeButton}
          aria-pressed={post.liked_by_me}
          aria-label={`좋아요 ${post.like_count}`}
          onClick={() => requireLogin(() => toggleLike.mutate(post))}
        >
          <Icon name="heart" size={14} filled={post.liked_by_me} /> {post.like_count}
        </button>
        <button
          type="button"
          className={styles.textButton}
          onClick={() => requireLogin(() => startReply(null))}
        >
          답글
        </button>
        {post.is_mine ? (
          <button
            type="button"
            className={styles.textButton}
            onClick={() =>
              requireLogin(() =>
                remove.mutate(post.id, { onError: () => showToast('댓글을 지우지 못했어요.') }),
              )
            }
          >
            삭제
          </button>
        ) : (
          <button
            type="button"
            className={styles.textButton}
            disabled={post.reported_by_me}
            onClick={() => requireLogin(() => setReporting(true))}
          >
            {post.reported_by_me ? '신고함' : '신고'}
          </button>
        )}
      </div>

      {post.comment_count > 0 && (
        <button
          type="button"
          className={styles.toggleReplies}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? '답글 숨기기' : `답글 ${post.comment_count}개 보기`}
        </button>
      )}
      {(open || replyTo) && (
        <ReplyList
          commentId={post.id}
          replyTo={replyTo}
          onReply={startReply}
          onCloseReply={() => setReplyTo(null)}
        />
      )}

      <ReportSheet
        target={reporting ? { target_type: 'post', target_id: post.id } : null}
        onClose={() => setReporting(false)}
      />
    </div>
  );
}
