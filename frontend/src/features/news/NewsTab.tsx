import { useState } from 'react';
import { Section } from '../../components/Section';
import { useCompanyNews } from '../../hooks/useNews';
import { NewsList } from './NewsList';
import { NewsSentimentCriteriaSheet } from './NewsSentimentCriteriaSheet';
import styles from './News.module.css';

/** 기업 상세 > 뉴스 상세: 최신순, [더 보기]로 다음 페이지 */
export function NewsTab({ stockCode }: { stockCode: string }) {
  const news = useCompanyNews(stockCode);
  const [criteriaOpen, setCriteriaOpen] = useState(false);

  return (
    <Section
      title="최근 소식"
      description="제목을 누르면 원문이 새 탭에서 열려요"
      action={
        <button
          type="button"
          className={styles.criteriaButton}
          onClick={() => setCriteriaOpen(true)}
        >
          기준 보기
        </button>
      }
    >
      <NewsList
        items={news.items}
        isPending={news.isPending}
        isError={news.isError}
        error={news.error}
        onRetry={() => news.refetch()}
        emptyText="이 기업의 최근 뉴스를 아직 찾지 못했어요"
        hasMore={news.hasNextPage}
        onMore={() => news.fetchNextPage()}
        isLoadingMore={news.isFetchingNextPage}
        label="기업 뉴스"
      />
      <NewsSentimentCriteriaSheet open={criteriaOpen} onClose={() => setCriteriaOpen(false)} />
    </Section>
  );
}
