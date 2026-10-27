import { useEffect, useId, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ApiError } from '../api/errors';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { Icon } from '../components/Icon';
import { SegmentedControl } from '../components/SegmentedControl';
import { Sheet } from '../components/Sheet';
import { COMMUNITY_LIMITS, findBannedWord } from '../config/communityRules';
import {
  categoryLabels,
  communityPaths,
  postCategories,
} from '../features/community/communityLabels';
import { CommunityNotice } from '../features/community/CommunityNotice';
import { useAuth } from '../hooks/useAuth';
import { useCommunityPost } from '../hooks/useCommunityPost';
import { usePostMutations } from '../hooks/usePostMutations';
import { useRequireLogin } from '../hooks/useRequireLogin';
import type { PostCategory } from '../types';
import styles from '../features/community/CommunityPost.module.css';

const categoryOptions = postCategories.map((value) => ({ value, label: categoryLabels[value] }));

/** 글쓰기(/write)·수정(/edit/:postId) — 로그인 필요 */
export function CommunityWritePage() {
  const { stockCode = '', postId } = useParams();
  const { isLoggedIn, isLoading } = useAuth();
  const requireLogin = useRequireLogin();
  const editing = Boolean(postId);
  const { data: post, isPending } = useCommunityPost(postId ?? '', { enabled: editing });

  if (isLoading) return <div className={styles.page} />;
  if (!isLoggedIn) {
    return (
      <div className={styles.page}>
        <EmptyState
          title="로그인하면 글을 쓸 수 있어요"
          description="글 보기는 로그인 없이 돼요."
          action={<Button onClick={() => requireLogin()}>로그인하기</Button>}
        />
      </div>
    );
  }
  if (editing && isPending) return <div className={styles.page} />;
  if (editing && (!post || !post.is_mine)) {
    return (
      <div className={styles.page}>
        <EmptyState title="내 글만 고칠 수 있어요" />
      </div>
    );
  }
  return (
    <WriteForm
      key={post?.id ?? 'new'}
      stockCode={stockCode}
      postId={postId}
      initial={post ? { category: post.category, title: post.title, body: post.body } : undefined}
    />
  );
}

function WriteForm({
  stockCode,
  postId,
  initial,
}: {
  stockCode: string;
  postId?: string;
  initial?: { category: PostCategory; title: string; body: string };
}) {
  const navigate = useNavigate();
  const titleId = useId();
  const bodyId = useId();
  const { create, update } = usePostMutations(stockCode);
  const [category, setCategory] = useState<PostCategory>(initial?.category ?? 'question');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [error, setError] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const dirty =
    title !== (initial?.title ?? '') ||
    body !== (initial?.body ?? '') ||
    category !== (initial?.category ?? 'question');
  const backTo = postId ? communityPaths.post(stockCode, postId) : communityPaths.list(stockCode);
  const saving = create.isPending || update.isPending;

  // 새로고침·탭 닫기는 브라우저가 묻게 해요. (화면 안 이동은 아래 시트로 물어요)
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  const leave = () => (dirty ? setConfirmLeave(true) : navigate(backTo));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const input = { category, title: title.trim(), body: body.trim() };
    if (!input.title || !input.body) {
      setError('제목과 본문을 모두 써 주세요.');
      return;
    }
    const banned = findBannedWord(`${input.title} ${input.body}`);
    if (banned) {
      setError(`쓸 수 없는 표현이 있어요: ${banned}. 고친 뒤 다시 등록해 주세요.`);
      return;
    }
    const done = (id: string) => navigate(communityPaths.post(stockCode, id), { replace: true });
    const fail = (e: unknown) =>
      setError(
        e instanceof ApiError ? e.message : '등록하지 못했어요. 잠시 후 다시 시도해 주세요.',
      );
    if (postId) update.mutate({ postId, input }, { onSuccess: (p) => done(p.id), onError: fail });
    else create.mutate(input, { onSuccess: (p) => done(p.id), onError: fail });
  };

  return (
    <div className={styles.page}>
      <button type="button" className={styles.back} onClick={leave}>
        <Icon name="back" size={18} /> 돌아가기
      </button>
      <h1 className={styles.title}>{postId ? '글 고치기' : '글쓰기'}</h1>
      <CommunityNotice />

      <form className={styles.form} onSubmit={submit}>
        <div className={styles.field}>
          <span className={styles.label}>말머리</span>
          <SegmentedControl
            label="말머리"
            options={categoryOptions}
            value={category}
            onChange={setCategory}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor={titleId} className={styles.label}>
            제목
          </label>
          <input
            id={titleId}
            className={styles.input}
            value={title}
            maxLength={COMMUNITY_LIMITS.titleMax}
            onChange={(e) => {
              setTitle(e.target.value);
              setError(null);
            }}
          />
          <span className={styles.counter} aria-live="polite">
            {title.length}/{COMMUNITY_LIMITS.titleMax}
          </span>
        </div>
        <div className={styles.field}>
          <label htmlFor={bodyId} className={styles.label}>
            본문
          </label>
          <textarea
            id={bodyId}
            className={styles.textarea}
            value={body}
            rows={10}
            maxLength={COMMUNITY_LIMITS.bodyMax}
            onChange={(e) => {
              setBody(e.target.value);
              setError(null);
            }}
          />
          <span className={styles.counter} aria-live="polite">
            {body.length.toLocaleString('ko-KR')}/{COMMUNITY_LIMITS.bodyMax.toLocaleString('ko-KR')}
          </span>
        </div>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <div className={styles.formButtons}>
          <Button variant="secondary" onClick={leave}>
            취소
          </Button>
          <Button type="submit" disabled={saving || !title.trim() || !body.trim()}>
            {saving ? '등록 중…' : postId ? '고치기' : '등록'}
          </Button>
        </div>
      </form>

      <Sheet
        open={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        title="작성 중인 글이 사라져요"
      >
        <p>지금 나가면 쓰던 내용이 저장되지 않아요. 나갈까요?</p>
        <Button size="lg" block onClick={() => navigate(backTo)}>
          나가기
        </Button>
        <Button block variant="ghost" onClick={() => setConfirmLeave(false)}>
          계속 쓰기
        </Button>
      </Sheet>
    </div>
  );
}
