import { useState } from 'react';
import { Button } from '../../components/Button';
import { ErrorState } from '../../components/ErrorState';
import { SegmentedControl } from '../../components/SegmentedControl';
import { COMMUNITY_LIMITS } from '../../config/communityRules';
import { useCommunityPosts } from '../../hooks/useCommunityPosts';
import { usePostMutations } from '../../hooks/usePostMutations';
import { useToast } from '../../hooks/useToast';
import type { PostSort } from '../../types';
import { CommentComposer } from './CommentComposer';
import { CommunityNotice } from './CommunityNotice';
import { CompanyComment } from './CompanyComment';
import styles from './Community.module.css';

const sortOptions = [
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '인기순' },
] as const;

/**
 * 기업 상세 > 커뮤니티: 이 기업에 대한 댓글을 바로 쓰고, 댓글에 답글을 달아요.
 * (서버에는 기업 댓글 = 글, 답글 = 그 글의 댓글로 저장돼요. 보기는 로그인 없이)
 */
export function CommunityTab({ stockCode }: { stockCode: string }) {
  const { showToast } = useToast();
  const [sort, setSort] = useState<PostSort>('latest');
  const list = useCommunityPosts(stockCode, sort);
  const { create } = usePostMutations(stockCode);

  return (
    <section className={styles.community} aria-label="커뮤니티">
      <CommunityNotice />

      <CommentComposer
        placeholder="이 기업에 대해 궁금한 점이나 공부한 내용을 남겨 보세요"
        maxLength={COMMUNITY_LIMITS.bodyMax}
        onSubmit={(input, { onError }) =>
          create.mutate(
            { category: 'free', body: input.body, image_url: input.image_url ?? null },
            {
              onError: (error) => {
                onError();
                showToast(error instanceof Error ? error.message : '댓글을 남기지 못했어요.');
              },
            },
          )
        }
      />

      <div className={styles.toolbar}>
        <h2 className={styles.countTitle}>댓글</h2>
        <SegmentedControl label="정렬" options={sortOptions} value={sort} onChange={setSort} />
      </div>

      {list.isPending && <div className={styles.loading} aria-label="댓글을 불러오고 있어요" />}
      {list.isError && (
        <ErrorState
          compact
          title="댓글을 불러오지 못했어요"
          error={list.error}
          onRetry={() => list.refetch()}
        />
      )}
      {!list.isPending && !list.isError && list.posts.length === 0 && (
        <p className={styles.empty}>아직 댓글이 없어요. 첫 댓글을 남겨 보세요.</p>
      )}

      {list.posts.length > 0 && (
        <ul className={styles.list} aria-label="기업 댓글">
          {list.posts.map((post) => (
            <li key={post.id}>
              <CompanyComment post={post} stockCode={stockCode} />
            </li>
          ))}
        </ul>
      )}
      {list.hasNextPage && (
        <Button
          variant="secondary"
          onClick={() => list.fetchNextPage()}
          disabled={list.isFetchingNextPage}
        >
          {list.isFetchingNextPage ? '불러오는 중…' : '더 보기'}
        </Button>
      )}
    </section>
  );
}
