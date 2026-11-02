import { useAuth } from '../../hooks/useAuth';
import { displayName } from './AuthContext';
import styles from './LoginButton.module.css';

export function LoginButton() {
  const { isLoggedIn, isLoading, user, loginWithGoogle, logout, devLogin } = useAuth();

  if (isLoading) return <span className={styles.button} aria-hidden="true" />;
  if (isLoggedIn && user) {
    return (
      <span className={styles.signedIn}>
        <span className={styles.user}>{displayName(user)}님</span>
        <button type="button" className={styles.devButton} onClick={() => void logout()}>
          로그아웃
        </button>
      </span>
    );
  }

  return (
    <span className={styles.signedIn}>
      <button type="button" className={styles.button} onClick={loginWithGoogle}>
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.2" />
          <path d="M12 12h8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
        <span className={styles.long}>Google로 로그인</span>
        <span className={styles.short}>로그인</span>
      </button>
      {/* 목 데이터 모드에서만: 로그인 상태 흐름을 확인하는 개발용 버튼 */}
      {devLogin && (
        <button type="button" className={styles.devButton} onClick={devLogin}>
          개발용 로그인
        </button>
      )}
    </span>
  );
}
