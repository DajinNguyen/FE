import { Link, NavLink, useLocation } from 'react-router';
import { useTheme } from '../hooks/useTheme';
import { HeaderSearch } from './HeaderSearch';
import { Icon } from './Icon';
import { Logo } from './Logo';
import styles from './AppHeader.module.css';

const navItems = [
  { to: '/', label: '홈' },
  { to: '/terms', label: '용어 카드' },
  { to: '/watchlist', label: '관심 기업' },
];

const themeIcon = { system: 'auto', light: 'sun', dark: 'moon' } as const;
const themeLabel = { system: '시스템 설정', light: '라이트 모드', dark: '다크 모드' } as const;

/** 모든 화면 위에 고정되는 내비게이션 */
export function AppHeader() {
  const { pathname } = useLocation();
  const { mode, cycle } = useTheme();

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo} aria-label="다진 홈">
          <Logo />
        </Link>

        <nav className={styles.nav} aria-label="주요 메뉴">
          {navItems.map((item) => {
            // 기업 상세는 홈 메뉴 아래에 있는 화면이에요.
            const active =
              item.to === '/'
                ? pathname === '/' || pathname.startsWith('/companies')
                : pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`${styles.navItem} ${active ? styles.active : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className={styles.actions}>
          {pathname !== '/' && (
            <div className={styles.search}>
              <HeaderSearch />
            </div>
          )}
          <button
            type="button"
            className={styles.iconButton}
            onClick={cycle}
            aria-label={`화면 모드: ${themeLabel[mode]} (눌러서 바꾸기)`}
            title={themeLabel[mode]}
          >
            <Icon name={themeIcon[mode]} size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
