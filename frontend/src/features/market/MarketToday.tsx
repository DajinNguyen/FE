import { ErrorState } from '../../components/ErrorState';
import { useMarketSummary } from '../../hooks/useMarketSummary';
import { formatMarketDate } from '../../utils/format';
import { MarketIndexes } from './MarketIndexes';
import styles from './Market.module.css';

/**
 * 메인 맨 위: 왼쪽 시장 한마디(페이지 제목, 가장 크게)·기준 시각, 오른쪽 코스피·코스닥 (세로)
 * 불러오지 못해도 같은 자리에 안내만 보여주고, 아래 검색창은 그대로 쓸 수 있어요.
 */
export function MarketToday() {
  const { data, isPending, isError, error, refetch } = useMarketSummary();

  if (isPending) {
    return (
      <section className={styles.today} aria-label="오늘의 시장" aria-busy="true">
        <div className={styles.headlineBlock}>
          <div className={`${styles.skeleton} ${styles.skeletonHeadline}`} />
          <div className={`${styles.skeleton} ${styles.skeletonMeta}`} />
        </div>
        <div className={`${styles.skeleton} ${styles.skeletonChips}`} />
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className={styles.today} aria-labelledby="market-headline">
        <div className={styles.headlineBlock}>
          <h1 id="market-headline" className={styles.failTitle}>
            시장 정보를 불러오지 못했어요
          </h1>
          <ErrorState compact error={error} onRetry={() => refetch()} />
        </div>
      </section>
    );
  }

  const asOf = formatMarketDate(data.as_of);
  return (
    <section className={styles.today} aria-labelledby="market-headline">
      <div className={styles.headlineBlock}>
        <h1 id="market-headline" className={styles.headline}>
          {data.headline}
        </h1>
        <p className={styles.meta}>
          {data.is_previous_session ? `직전 거래일 ${asOf} 기준` : `${asOf} 기준`} · AI 정리
        </p>
      </div>
      <MarketIndexes indexes={data.indices} />
    </section>
  );
}
