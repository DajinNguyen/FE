import { TrendingUp } from 'lucide-react';
import { Link } from 'react-router';
import { ErrorState } from '../../components/ErrorState';
import { Icon } from '../../components/Icon';
import { formatAdk } from '../../config/currency';
import { MOCK_INVEST_PATH, MOCK_INVEST_SHORT_NOTICE } from '../../config/mockInvest';
import { useMockPortfolio } from '../../hooks/useMockInvest';
import { useRequireLogin } from '../../hooks/useRequireLogin';
import { useWallet } from '../../hooks/useWallet';
import type { MockPortfolio } from '../../types';
import { formatRate, formatSignedWon, formatWon, toneOf, toneWords } from './mockInvestFormat';
import styles from './MockInvest.module.css';

const TITLE = '모의투자';

function Head() {
  return (
    <span className={styles.cardHead}>
      <TrendingUp size={18} strokeWidth={2} aria-hidden="true" />
      <span className={styles.cardTitle}>{TITLE}</span>
      <span className={styles.cardBadge}>{MOCK_INVEST_SHORT_NOTICE}</span>
    </span>
  );
}

function Summary({ portfolio }: { portfolio: MockPortfolio }) {
  const rate = portfolio.profit_rate;
  return (
    <>
      <span className={styles.cardLabel}>총 자산</span>
      <span className={styles.cardTotal}>{formatWon(portfolio.total_asset)}</span>
      <dl className={styles.cardStats}>
        <div>
          <dt>수익률</dt>
          <dd className={styles[toneOf(rate)]}>
            {rate === null ? '-' : formatRate(rate)}
            {rate !== null && <span className="visually-hidden"> {toneWords(rate)}</span>}
          </dd>
        </div>
        <div>
          <dt>보유 종목</dt>
          <dd>{portfolio.holdings.length}개</dd>
        </div>
        <div>
          <dt>오늘 변화</dt>
          <dd className={styles[toneOf(portfolio.today_change)]}>
            {formatSignedWon(portfolio.today_change)}
          </dd>
        </div>
      </dl>
      <span className={styles.cardMore}>
        모의투자 하러 가기 <Icon name="chevronRight" size={16} />
      </span>
    </>
  );
}

/**
 * 메인 "관심이 몰리는 산업 TOP 3" 오른쪽(좁은 화면은 아래) 모의투자 카드.
 * - 비로그인: 로그인 안내 (누르면 로그인 시트)
 * - 로그인 + 시작 안 함: 가입 선물 ADK 로 시작하기
 * - 로그인 + 시작함: 총 자산·수익률·보유 종목 수·오늘 변화
 * 카드 전체를 누르면 /mock-invest 로 가요.
 */
export function MockInvestCard() {
  const { data, isLoggedIn, isPending, isError, error, refetch } = useMockPortfolio();
  const { balance } = useWallet();
  const requireLogin = useRequireLogin();

  if (!isLoggedIn) {
    return (
      <section className={styles.cardSection} aria-label={TITLE}>
        <button
          type="button"
          className={styles.card}
          onClick={() => requireLogin(undefined, 'mockInvest')}
        >
          <Head />
          <span className={styles.cardMessage}>로그인하면 모의투자를 할 수 있어요</span>
          <span className={styles.cardAction}>Google로 로그인</span>
        </button>
      </section>
    );
  }

  if (isError) {
    return (
      <section className={`${styles.cardSection} ${styles.cardStatic}`} aria-label={TITLE}>
        <Head />
        <ErrorState
          compact
          title="모의투자 정보를 불러오지 못했어요"
          error={error}
          onRetry={() => refetch()}
        />
      </section>
    );
  }

  return (
    <section className={styles.cardSection} aria-label={TITLE}>
      <Link to={MOCK_INVEST_PATH} className={styles.card}>
        <Head />
        {isPending || !data ? (
          <span className={styles.cardSkeleton} aria-hidden="true" />
        ) : data.started ? (
          <Summary portfolio={data} />
        ) : (
          <>
            <span className={styles.cardMessage}>
              가입 선물로 받은 ADK로 모의투자를 시작해 보세요
            </span>
            {balance !== null && <span className={styles.cardSub}>지금 {formatAdk(balance)}</span>}
            <span className={styles.cardAction}>시작하기</span>
          </>
        )}
      </Link>
    </section>
  );
}
