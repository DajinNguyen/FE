import { Icon } from '../../components/Icon';
import { TermText } from '../../components/TermText';
import type { NewsItem } from '../../types';
import { formatRelativeTime } from '../../utils/format';
import styles from './News.module.css';

interface NewsListItemProps {
  item: NewsItem;
  /** 작게: 제목·언론사·시간만 (메인 "왜 움직였나요?" 근거, 리포트 근거) */
  compact?: boolean;
}

/** 뉴스 한 줄: 제목(원문 새 탭) · 언론사 · 시간 · 한 줄 요약 · 관련 숫자. 기사 전문은 보여주지 않아요. */
export function NewsListItem({ item, compact = false }: NewsListItemProps) {
  return (
    <article className={`${styles.item} ${compact ? styles.compact : ''}`}>
      <a href={item.url} target="_blank" rel="noopener noreferrer" className={styles.title}>
        {item.title}
        <Icon name="external" size={compact ? 14 : 16} className={styles.external} />
        <span className="visually-hidden">(원문이 새 탭에서 열려요)</span>
      </a>
      <p className={styles.meta}>
        {item.press} ·{' '}
        <time dateTime={item.published_at}>{formatRelativeTime(item.published_at)}</time>
      </p>
      {!compact && item.summary_short && (
        <p className={styles.summary}>
          <TermText text={item.summary_short} />
        </p>
      )}
      {!compact && item.related_metric && (
        <p className={styles.metric}>
          관련 숫자 {item.related_metric.label} <strong>{item.related_metric.value}</strong>
        </p>
      )}
    </article>
  );
}
