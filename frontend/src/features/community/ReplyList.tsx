import { useState } from 'react';
import { useComments } from '../../hooks/useComments';
import { useRequireLogin } from '../../hooks/useRequireLogin';
import { formatRelativeTime } from '../../utils/format';
import { CommentBody } from './CommentBody';
import { CommentComposer } from './CommentComposer';
import { DELETED_COMMENT_TEXT, HIDDEN_COMMENT_TEXT } from './communityLabels';
import { ReportSheet } from './ReportSheet';
import styles from './Comment.module.css';

interface ReplyListProps {
  /** 답글이 달린 기업 댓글 id */
  commentId: string;
  /** 답글 입력창을 열었는지, 연 경우 "@닉네임" 대상 (원댓글에 다는 답글이면 null) */
  replyTo: { nickname: string | null } | null;
  onReply: (nickname: string | null) => void;
  onCloseReply: () => void;
}

/** 기업 댓글의 답글 목록 (한 단계만 들여쓰기, 답글의 답글은 "@닉네임") */
export function ReplyList({ commentId, replyTo, onReply, onCloseReply }: ReplyListProps) {
  const requireLogin = useRequireLogin();
  const { comments, isPending, isError, refetch, create, remove } = useComments(commentId);
  const [reportingId, setReportingId] = useState<string | null>(null);

  return (
    <div className={styles.replyArea}>
      {isPending && <p className={styles.muted}>답글을 불러오고 있어요…</p>}
      {isError && (
        <p className={styles.muted}>
          답글을 불러오지 못했어요.{' '}
          <button type="button" className={styles.textButton} onClick={() => refetch()}>
            다시 시도
          </button>
        </p>
      )}
      {comments.length > 0 && (
        <ul className={styles.replies} aria-label="답글">
          {comments.map((reply) => {
            const pending = reply.id.startsWith('temp-');
            return (
              <li key={reply.id} className={styles.item}>
                {reply.is_deleted ? (
                  <p className={styles.muted}>{DELETED_COMMENT_TEXT}</p>
                ) : reply.is_hidden ? (
                  <p className={styles.muted}>{HIDDEN_COMMENT_TEXT}</p>
                ) : (
                  <>
                    <p className={styles.meta}>
                      <strong>{reply.author.nickname}</strong> ·{' '}
                      {formatRelativeTime(reply.created_at)}
                    </p>
                    <CommentBody
                      body={reply.body}
                      replyTo={reply.reply_to_nickname}
                      imageUrl={reply.image_url}
                    />
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.textButton}
                        disabled={pending}
                        onClick={() => requireLogin(() => onReply(reply.author.nickname))}
                      >
                        답글
                      </button>
                      {reply.is_mine ? (
                        <button
                          type="button"
                          className={styles.textButton}
                          disabled={pending}
                          onClick={() => requireLogin(() => remove.mutate(reply.id))}
                        >
                          삭제
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={styles.textButton}
                          onClick={() => requireLogin(() => setReportingId(reply.id))}
                        >
                          신고
                        </button>
                      )}
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {replyTo && (
        <div className={styles.replyForm}>
          <CommentComposer
            key={replyTo.nickname ?? 'root'}
            reply
            replyTo={replyTo.nickname ?? undefined}
            placeholder="답글을 남겨 보세요"
            autoFocus
            onSubmit={(input, { onError }) => {
              create.mutate(input, { onError });
              onCloseReply();
            }}
            onCancel={onCloseReply}
          />
        </div>
      )}
      <ReportSheet
        target={reportingId ? { target_type: 'comment', target_id: reportingId } : null}
        onClose={() => setReportingId(null)}
      />
    </div>
  );
}
