import { useState } from 'react';
import { Link } from 'react-router';
import { industryColorStyle, industryIcon } from '../../config/industryIcons';
import { useMarketSummary } from '../../hooks/useMarketSummary';
import type { MarketReason } from '../../types';
import { NewsList } from '../news/NewsList';
import { NewsSentimentCriteriaSheet } from '../news/NewsSentimentCriteriaSheet';
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

function ReasonItem({ reason }: { reason: MarketReason }) {
  // 이유 앞 아이콘: 첫 번째 관련 산업 (산업 id 와 아이콘 이름이 같아요)
  const industryId = reason.industries[0]?.industry_id ?? '';
  const Icon = industryIcon(industryId);
  return (
    <li className={styles.reason}>
      <div className={styles.reasonHead}>
        <span
          className={styles.reasonIcon}
          style={industryColorStyle(industryId)}
          aria-hidden="true"
        >
          <Icon size={20} strokeWidth={1.75} />
        </span>
        <h3 className={styles.reasonTitle}>{reason.title}</h3>
      </div>
      <p className={styles.reasonText}>{reason.description}</p>
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
      {reason.news.length > 0 && (
        <div className={styles.reasonNews}>
          <p className={styles.reasonNewsLabel}>근거 뉴스</p>
          <NewsList items={reason.news.slice(0, 1)} compact label={`${reason.title} 근거 뉴스`} />
        </div>
      )}
    </li>
  );
}

/** 오늘 시장, 왜 움직였나요? 이유 3개 (각 이유 앞에 관련 산업 아이콘) */
export function MarketReasons() {
  const { data, isPending } = useMarketSummary();
  const [criteriaOpen, setCriteriaOpen] = useState(false);
  // 실패 안내는 맨 위 시장 한마디 자리에서 한 번만 보여줘요.
  if (isPending) {
    return <div className={`${styles.skeleton} ${styles.skeletonReasons}`} aria-hidden="true" />;
  }
  const reasons = data?.reasons ?? [];
  if (reasons.length === 0) return null;
  return (
    <section aria-labelledby="market-reasons" className={styles.reasons}>
      <div className={styles.reasonsHead}>
        <h2 id="market-reasons" className={styles.reasonsTitle}>
          오늘 시장, 왜 움직였나요?
        </h2>
        <button
          type="button"
          className={styles.criteriaButton}
          onClick={() => setCriteriaOpen(true)}
        >
          기준 보기
        </button>
      </div>
      <ol className={styles.reasonList}>
        {reasons.slice(0, 3).map((reason) => (
          <ReasonItem key={reason.title} reason={reason} />
        ))}
      </ol>
      <NewsSentimentCriteriaSheet open={criteriaOpen} onClose={() => setCriteriaOpen(false)} />
    </section>
  );
}
