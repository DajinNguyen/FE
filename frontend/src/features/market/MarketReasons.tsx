import { Link } from 'react-router';
import type { MarketReason } from '../../types';
import { NewsList } from '../news/NewsList';
import styles from './Market.module.css';

/** 산업 칩: "반도체 ▲2.1%" → 산업 페이지 (색은 숫자에만, 화살표와 글자로도 알려줘요) */
function IndustryChip({ id, name, changeRate }: { id: string; name: string; changeRate: number }) {
  const direction = changeRate > 0 ? 'rise' : changeRate < 0 ? 'fall' : 'flat';
  const arrow = { rise: '▲', fall: '▼', flat: '' }[direction];
  const word = { rise: '상승', fall: '하락', flat: '보합' }[direction];
  return (
    <li>
      <Link to={`/industries/${id}`} className={styles.industryChip}>
        {name}{' '}
        <span className={styles[direction]}>
          <span aria-hidden="true">{arrow}</span>
          <span className="visually-hidden">{word}</span>
          {Math.abs(changeRate).toFixed(1)}%
        </span>
      </Link>
    </li>
  );
}

/** 오늘 시장이 왜 이렇게 움직였나요? 이유 3개: 제목 → 설명 → 근거 뉴스 → 관련 산업 */
export function MarketReasons({ reasons }: { reasons: MarketReason[] }) {
  if (reasons.length === 0) return null;
  return (
    <section aria-labelledby="market-reasons" className={styles.reasons}>
      <h2 id="market-reasons" className={styles.reasonsTitle}>
        오늘 시장이 왜 이렇게 움직였나요?
      </h2>
      <ol className={styles.reasonList}>
        {reasons.slice(0, 3).map((reason) => (
          <li key={reason.title} className={styles.reason}>
            <h3 className={styles.reasonTitle}>{reason.title}</h3>
            <p className={styles.reasonText}>{reason.description}</p>
            {reason.news.length > 0 && (
              <div className={styles.reasonNews}>
                <p className={styles.reasonNewsLabel}>근거 뉴스</p>
                <NewsList items={reason.news} compact label={`${reason.title} 근거 뉴스`} />
              </div>
            )}
            {reason.industries.length > 0 && (
              <ul className={styles.chips} aria-label="관련 산업">
                {reason.industries.map((industry) => (
                  <IndustryChip
                    key={industry.industry_id}
                    id={industry.industry_id}
                    name={industry.name}
                    changeRate={industry.change_rate}
                  />
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
