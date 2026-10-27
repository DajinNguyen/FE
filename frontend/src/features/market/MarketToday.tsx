import { useMarketSummary } from '../../hooks/useMarketSummary';
import { formatMarketDate } from '../../utils/format';
import { MarketIndexes } from './MarketIndexes';
import { MarketReasons } from './MarketReasons';
import styles from './Market.module.css';

/** 한마디 아래 작게 보여주는 서비스 소개 한 줄 */
export const SERVICE_INTRO =
  '궁금한 기업을 검색하면, AI가 재무제표·뉴스·사업 방향을 근거로 쉽게 설명해 드려요';

/**
 * 메인 맨 위 "오늘의 시장": 한마디(페이지 제목) → 지수 → 왜 움직였나요?
 * 불러오지 못하면 안내만 보여주고, 아래 검색창은 그대로 쓸 수 있어요.
 */
export function MarketToday() {
  const { data, isPending, isError } = useMarketSummary();

  if (isPending) {
    return (
      <section className={styles.today} aria-label="오늘의 시장" aria-busy="true">
        <div className={`${styles.skeleton} ${styles.skeletonHeadline}`} />
        <div className={`${styles.skeleton} ${styles.skeletonIndex}`} />
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className={styles.today} aria-labelledby="market-headline">
        <h1 id="market-headline" className={styles.failTitle}>
          시장 정보를 불러오지 못했어요
        </h1>
        <p className={styles.asOf}>
          잠시 후 다시 확인해 주세요. 아래에서 기업은 바로 검색할 수 있어요.
        </p>
        <p className={styles.intro}>{SERVICE_INTRO}</p>
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
        <p className={styles.asOf}>
          {data.is_previous_session ? `직전 거래일(${asOf}) 기준` : `${asOf} 기준`} · AI가 뉴스와
          지수를 바탕으로 정리했어요
        </p>
        <p className={styles.intro}>{SERVICE_INTRO}</p>
      </div>
      <MarketIndexes indexes={data.indices} />
      <MarketReasons reasons={data.reasons} />
    </section>
  );
}
