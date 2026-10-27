import { useAuth } from '../../hooks/useAuth';
import styles from './LoginButton.module.css';

export function LoginButton() {
  const { isLoggedIn, isLoading, user, loginWithGoogle } = useAuth();

  if (isLoading) return <span className={styles.button} aria-hidden="true" />;
  if (isLoggedIn && user) return <span className={styles.user}>{user.name}님</span>;

  return (
    <button type="button" className={styles.button} onClick={loginWithGoogle}>
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.2" />
        <path d="M12 12h8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      <span className={styles.long}>Google로 로그인</span>
      <span className={styles.short}>로그인</span>
    </button>
  );
}
