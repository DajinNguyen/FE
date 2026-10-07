import { useNavigate } from 'react-router';
import { Button } from '../components/Button';
import { CompanyRow } from '../components/CompanyRow';
import { EmptyState } from '../components/EmptyState';
import { useCompaniesByCodes } from '../hooks/useCompanies';
import { useOpenCompany } from '../hooks/useOpenCompany';
import { useWatchlist } from '../hooks/useWatchlist';
import styles from './WatchlistPage.module.css';

export function WatchlistPage() {
  const navigate = useNavigate();
  const { stockCodes } = useWatchlist();
  const { data: companies } = useCompaniesByCodes(stockCodes);
  const openCompany = useOpenCompany();

  // 목록을 다시 받아오는 동안에도, 방금 뺀 회사는 바로 사라지게 해요.
  const visible = (companies ?? []).filter((c) => stockCodes.includes(c.stock_code));

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>관심 기업</h1>
        <p className={styles.subtitle}>하트를 누른 회사를 모아서 보여줘요</p>
      </header>

      {stockCodes.length === 0 ? (
        <EmptyState
          title="아직 담은 회사가 없어요"
          description="회사 화면 오른쪽 위의 하트를 누르면 여기에 모여요."
          action={<Button onClick={() => navigate('/')}>회사 찾아보기</Button>}
        />
      ) : (
        <ul className={styles.list}>
          {visible.map((company) => (
            <CompanyRow key={company.stock_code} company={company} onSelect={openCompany} />
          ))}
        </ul>
      )}

      <p className={styles.notice}>
        Google 로그인 후 계정에 저장돼요. 이메일과 이름만 받고 전화번호 같은 민감한 정보는 받지
        않아요.
      </p>
    </div>
  );
}
