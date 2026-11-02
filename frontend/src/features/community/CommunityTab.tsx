import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../../components/Button';
import { SegmentedControl } from '../../components/SegmentedControl';
import { useCommunityPosts } from '../../hooks/useCommunityPosts';
import { useRequireLogin } from '../../hooks/useRequireLogin';
import type { PostCategory, PostSort } from '../../types';
import { categoryLabels, communityPaths, postCategories } from './communityLabels';
import { CommunityNotice } from './CommunityNotice';
import { PostListItem } from './PostListItem';
import styles from './Community.module.css';

const sortOptions = [
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '인기순' },
] as const;

/** 기업 상세 > 커뮤니티: 이 기업에 대해 묻고 나누는 게시판 (보기는 로그인 없이) */
export function CommunityTab({ stockCode }: { stockCode: string }) {
  const navigate = useNavigate();
  const requireLogin = useRequireLogin();
  const [sort, setSort] = useState<PostSort>('latest');
  const [category, setCategory] = useState<PostCategory | undefined>(undefined);
  const list = useCommunityPosts(stockCode, sort, category);

  const write = () => requireLogin(() => navigate(communityPaths.write(stockCode)));

  return (
    <section className={styles.community} aria-label="커뮤니티">
      <CommunityNotice />

      <div className={styles.toolbar}>
        <SegmentedControl label="정렬" options={sortOptions} value={sort} onChange={setSort} />
        <Button onClick={write}>글쓰기</Button>
      </div>
      <div className={styles.filters} role="group" aria-label="말머리">
        {[undefined, ...postCategories].map((value) => (
          <button
            key={value ?? 'all'}
            type="button"
            className={styles.filter}
            aria-pressed={category === value}
            onClick={() => setCategory(value)}
          >
            {value ? categoryLabels[value] : '전체'}
          </button>
        ))}
      </div>

      {list.isPending && <div className={styles.loading} aria-label="글을 불러오고 있어요" />}
      {list.isError && (
        <p className={styles.empty}>글을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>
      )}
      {!list.isPending && !list.isError && list.posts.length === 0 && (
        <div className={styles.emptyBox}>
          <p className={styles.emptyTitle}>
            {category ? `${categoryLabels[category]} 글이 아직 없어요` : '첫 글을 남겨 보세요'}
          </p>
          <p className={styles.empty}>이 기업에 대해 궁금한 점이나 공부한 내용을 나눠 보세요.</p>
          <Button variant="secondary" onClick={write}>
            글쓰기
          </Button>
        </div>
      )}

      {list.posts.length > 0 && (
        <ul className={styles.list} aria-label="글 목록">
          {list.posts.map((post) => (
            <li key={post.id}>
              <PostListItem post={post} />
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
