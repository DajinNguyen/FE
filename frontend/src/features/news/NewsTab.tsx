import { EmptyState } from '../../components/EmptyState';
import { Icon } from '../../components/Icon';
import { Section } from '../../components/Section';
import { TermText } from '../../components/TermText';
import { useCompanyNews } from '../../hooks/useNews';
import { formatRelativeTime } from '../../utils/format';
import styles from './NewsTab.module.css';

export function NewsTab({ stockCode }: { stockCode: string }) {
  const { items: news, isPending, isError } = useCompanyNews(stockCode);

  if (isPending) return <p className={styles.loading}>최근 소식을 불러오고 있어요…</p>;
  if (isError || news.length === 0)
    return (
      <EmptyState
        title="자료를 찾지 못했어요"
        description="이 기업의 최근 뉴스를 아직 불러오지 못했어요."
      />
    );

  return (
    <Section title="최근 소식" description="기사 제목을 누르면 원문으로 이동해요">
      <ul className={styles.list}>
        {news.map((item) => (
          <li key={item.id} className={styles.item}>
            {item.url ? (
              <a href={item.url} target="_blank" rel="noopener noreferrer" className={styles.title}>
                {item.title}
                <Icon name="external" size={16} className={styles.external} />
                <span className="visually-hidden">(새 창에서 열려요)</span>
              </a>
            ) : (
              <p className={styles.title}>{item.title}</p>
            )}
            <p className={styles.meta}>
              {item.press} · {formatRelativeTime(item.published_at)}
            </p>
            <p className={styles.summary}>
              <TermText text={item.summary_short} />
            </p>
            {item.related_metric && (
              <p className={styles.link}>
                <span className={styles.linkBadge}>재무 연결</span>
                {item.related_metric.label} <strong>{item.related_metric.value}</strong>
              </p>
            )}
          </li>
        ))}
      </ul>
    </Section>
  );
}
