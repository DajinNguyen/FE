import styles from './Logo.module.css';

/** 다진 로고: 차곡차곡 다져 쌓는 세 줄 모양 */
export function Logo() {
  return (
    <span className={styles.logo} aria-label="다진">
      <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="var(--brand)" />
        <path
          d="M9 21h14M11 16h10M13 11h6"
          stroke="var(--on-brand)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <span className={styles.text}>다진</span>
    </span>
  );
}
