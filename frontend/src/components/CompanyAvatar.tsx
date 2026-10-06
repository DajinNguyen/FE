import styles from './CompanyAvatar.module.css';

/** 회사 로고 대신 이름 첫 글자로 만든 아이콘 */
export function CompanyAvatar({
  name,
  code,
  size = 44,
}: {
  name: string;
  code: string;
  size?: number;
}) {
  const tone = (Number(code.slice(-2)) % 5) + 1;
  return (
    <span
      className={styles.avatar}
      style={{
        width: size,
        height: size,
        background: `var(--avatar-${tone})`,
        fontSize: size * 0.4,
      }}
      aria-hidden="true"
    >
      {name.charAt(0)}
    </span>
  );
}
