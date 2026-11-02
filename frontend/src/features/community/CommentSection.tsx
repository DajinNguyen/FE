import { useId, useState, type FormEvent } from 'react';
import { Button } from '../../components/Button';
import { COMMUNITY_LIMITS, findBannedWord } from '../../config/communityRules';
import { useComments } from '../../hooks/useComments';
import { useRequireLogin } from '../../hooks/useRequireLogin';
import { formatRelativeTime } from '../../utils/format';
import { HIDDEN_COMMENT_TEXT } from './communityLabels';
import styles from './CommunityPost.module.css';

/** 댓글 목록 + 입력 (쓰기·지우기는 로그인 필요) */
export function CommentSection({ postId }: { postId: string }) {
  const inputId = useId();
  const requireLogin = useRequireLogin();
  const { comments, isPending, create, remove } = useComments(postId);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const body = text.trim();
    if (!body) return;
    const banned = findBannedWord(body);
    if (banned) {
      setError(`${banned}은(는) 쓸 수 없어요.`);
      return;
    }
    requireLogin(() => {
      create.mutate(body);
      setText('');
      setError(null);
    });
  };

  return (
    <section className={styles.comments} aria-labelledby="comments-title">
      <h2 id="comments-title" className={styles.commentsTitle}>
        댓글 {comments.length}
      </h2>
      {isPending ? (
        <p className={styles.muted}>댓글을 불러오고 있어요…</p>
      ) : comments.length === 0 ? (
        <p className={styles.muted}>아직 댓글이 없어요.</p>
      ) : (
        <ul className={styles.commentList} aria-label="댓글">
          {comments.map((comment) => (
            <li key={comment.id} className={styles.comment}>
              {comment.is_hidden ? (
                <p className={styles.muted}>{HIDDEN_COMMENT_TEXT}</p>
              ) : (
                <>
                  <p className={styles.commentMeta}>
                    <strong>{comment.author.nickname}</strong> ·{' '}
                    {formatRelativeTime(comment.created_at)}
                    {comment.is_mine && (
                      <button
                        type="button"
                        className={styles.textButton}
                        onClick={() => requireLogin(() => remove.mutate(comment.id))}
                        disabled={comment.id.startsWith('temp-')}
                      >
                        삭제
                      </button>
                    )}
                  </p>
                  <p className={styles.commentBody}>{comment.body}</p>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <form className={styles.commentForm} onSubmit={submit}>
        <label htmlFor={inputId} className="visually-hidden">
          댓글 입력
        </label>
        <textarea
          id={inputId}
          className={styles.commentInput}
          value={text}
          maxLength={COMMUNITY_LIMITS.commentMax}
          rows={2}
          placeholder="댓글을 남겨 보세요"
          onChange={(e) => {
            setText(e.target.value);
            setError(null);
          }}
        />
        <div className={styles.formRow}>
          <span className={styles.counter}>
            {text.length}/{COMMUNITY_LIMITS.commentMax}
          </span>
          <Button type="submit" disabled={!text.trim()}>
            등록
          </Button>
        </div>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </form>
    </section>
  );
}
