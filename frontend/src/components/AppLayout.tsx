import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { useUserDataResetCount } from '../hooks/userData';
import { AppHeader } from './AppHeader';
import styles from './AppLayout.module.css';

export function AppLayout() {
  const { pathname } = useLocation();
  // 로그아웃하면 페이지를 다시 그려서 화면 안에 남은 정답·진행 상태도 비워요.
  const resetCount = useUserDataResetCount();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className={styles.app}>
      <AppHeader />
      <main key={`${pathname}:${resetCount}`} className={styles.main}>
        <Outlet />
      </main>
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p className={styles.footerBrand}>다진 · 어려운 재무 정보를 쉬운 말로</p>
          <p>
            다진의 정보는 기업을 이해하도록 돕는 교육용 정보이며 투자 추천이 아니에요. 데이터 출처:
            금융감독원 DART · 한국거래소 · 회사 실적 발표
          </p>
        </div>
      </footer>
    </div>
  );
}
