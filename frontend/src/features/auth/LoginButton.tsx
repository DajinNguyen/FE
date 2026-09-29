import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import styles from './LoginButton.module.css';

export function LoginButton() {
  const { isLoggedIn, user, loginWithGoogle } = useAuth();
  const { showToast } = useToast();

  if (isLoggedIn && user) return <span className={styles.user}>{user.name}님</span>;

  const handleClick = async () => {
    const ok = await loginWithGoogle();
    if (!ok) showToast('Google 로그인은 곧 연결할 예정이에요. 지금은 둘러보기만 할 수 있어요.');
  };

  return (
    <button type="button" className={styles.button} onClick={handleClick}>
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.2" />
        <path d="M12 12h8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      <span className={styles.long}>Google로 로그인</span>
      <span className={styles.short}>로그인</span>
    </button>
  );
}
