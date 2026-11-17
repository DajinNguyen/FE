import { Icon } from '../../components/Icon';
import type { ChatSource } from '../../types';
import { formatMarketDate } from '../../utils/format';
import { safeSourceUrl } from '../../utils/safeUrl';
import styles from './Chat.module.css';

/** 답변 아래 "출처": 답변이 근거로 든 기사·공시의 원문 링크 (새 창) */
export function ChatSources({ sources }: { sources?: ChatSource[] }) {
  const list = (sources ?? []).filter((s) => s.title && safeSourceUrl(s.url));
  if (list.length === 0) return null;
  return (
    <div className={styles.sources}>
      <p className={styles.sourcesTitle}>출처</p>
      <ul className={styles.sourceList} aria-label="답변 출처">
        {list.map((source) => {
          const meta = [source.press, source.date && formatMarketDate(source.date)]
            .filter(Boolean)
            .join(' · ');
          return (
            <li key={source.url}>
              <a href={safeSourceUrl(source.url)!} target="_blank" rel="noopener noreferrer">
                <span className={styles.sourceTitle}>{source.title}</span>
                <Icon name="external" size={14} />
                <span className="visually-hidden">(새 창에서 열려요)</span>
              </a>
              {meta && <span className={styles.sourceMeta}>{meta}</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
