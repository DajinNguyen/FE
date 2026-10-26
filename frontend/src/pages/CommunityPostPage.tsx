import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { Icon } from '../components/Icon';
import { Sheet } from '../components/Sheet';
import { CommentSection } from '../features/community/CommentSection';
import {
  categoryLabels,
  communityPaths,
  HIDDEN_POST_TEXT,
} from '../features/community/communityLabels';
import { CommunityNotice } from '../features/community/CommunityNotice';
import { ReportSheet } from '../features/community/ReportSheet';
import { useCompany } from '../hooks/useCompanies';
import { useCommunityPost } from '../hooks/useCommunityPost';
import { usePostMutations } from '../hooks/usePostMutations';
import { useRequireLogin } from '../hooks/useRequireLogin';
import { useToast } from '../hooks/useToast';
import { formatRelativeTime } from '../utils/format';
import styles from '../features/community/CommunityPost.module.css';

/** 글 보기: 본문, 좋아요, (내 글이면) 수정·삭제, 댓글 */
export function CommunityPostPage() {
  const { stockCode = '', postId = '' } = useParams();
  const navigate = useNavigate();
  const requireLogin = useRequireLogin();
  const { showToast } = useToast();
  const { data: company } = useCompany(stockCode);
  const { data: post, isPending, isError } = useCommunityPost(postId);
  const { toggleLike, remove } = usePostMutations(stockCode);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [reporting, setReporting] = useState(false);

  const back = (
    <Link to={communityPaths.list(stockCode)} className={styles.back}>
      <Icon name="back" size={18} /> {company?.name ?? '기업'} 커뮤니티
    </Link>
  );

  if (isPending) return <div className={styles.page}>{back}</div>;
  if (isError || !post) {
    return (
      <div className={styles.page}>
        {back}
        <EmptyState
          title="글을 찾지 못했어요"
          description="지워졌거나 주소가 바뀌었을 수 있어요."
        />
      </div>
    );
  }

  const deletePost = () =>
    remove.mutate(post.id, {
      onSuccess: () => {
        showToast('글을 지웠어요.');
        navigate(communityPaths.list(stockCode), { replace: true });
      },
      onError: () => showToast('글을 지우지 못했어요.'),
    });

  return (
    <div className={styles.page}>
      {back}
      <CommunityNotice />

      {post.is_hidden ? (
        <p className={styles.hidden}>{HIDDEN_POST_TEXT}</p>
      ) : (
        <article className={styles.post}>
          <p className={styles.category}>{categoryLabels[post.category]}</p>
          <h1 className={styles.title}>{post.title}</h1>
          <p className={styles.meta}>
            <span>
              {post.author.nickname} · {formatRelativeTime(post.created_at)}
              {post.updated_at && ' · 수정됨'}
            </span>
            {post.is_mine && (
              <span className={styles.ownerActions}>
                <Link to={communityPaths.edit(stockCode, post.id)} className={styles.textButton}>
                  수정
                </Link>
                <button
                  type="button"
                  className={styles.textButton}
                  onClick={() => requireLogin(() => setConfirmDelete(true))}
                >
                  삭제
                </button>
              </span>
            )}
          </p>
          <div className={styles.body}>{post.body}</div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.like}
              aria-pressed={post.liked_by_me}
              onClick={() => requireLogin(() => toggleLike.mutate(post))}
            >
              <Icon name="heart" size={18} filled={post.liked_by_me} />
              좋아요 {post.like_count}
            </button>
            {!post.is_mine && (
              <button
                type="button"
                className={styles.report}
                disabled={post.reported_by_me}
                onClick={() => requireLogin(() => setReporting(true))}
              >
                {post.reported_by_me ? '신고함' : '신고'}
              </button>
            )}
          </div>
        </article>
      )}

      {!post.is_hidden && <CommentSection postId={post.id} />}

      <ReportSheet
        target={reporting ? { target_type: 'post', target_id: post.id } : null}
        onClose={() => setReporting(false)}
      />

      <Sheet open={confirmDelete} onClose={() => setConfirmDelete(false)} title="글을 지울까요?">
        <p>지운 글과 댓글은 되돌릴 수 없어요.</p>
        <Button
          size="lg"
          block
          onClick={() => {
            setConfirmDelete(false);
            deletePost();
          }}
        >
          지우기
        </Button>
        <Button block variant="ghost" onClick={() => setConfirmDelete(false)}>
          취소
        </Button>
      </Sheet>
    </div>
  );
}
