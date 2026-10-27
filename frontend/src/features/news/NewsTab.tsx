import { Section } from '../../components/Section';
import { useCompanyNews } from '../../hooks/useNews';
import { NewsList } from './NewsList';

/** 기업 상세 > 뉴스 상세: 최신순, [더 보기]로 다음 페이지 */
export function NewsTab({ stockCode }: { stockCode: string }) {
  const news = useCompanyNews(stockCode);

  return (
    <Section title="최근 소식" description="제목을 누르면 원문이 새 탭에서 열려요">
      <NewsList
        items={news.items}
        isPending={news.isPending}
        isError={news.isError}
        emptyText="이 기업의 최근 뉴스를 아직 찾지 못했어요"
        hasMore={news.hasNextPage}
        onMore={() => news.fetchNextPage()}
        isLoadingMore={news.isFetchingNextPage}
        label="기업 뉴스"
      />
    </Section>
  );
}
