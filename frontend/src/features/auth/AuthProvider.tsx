import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { getMe, googleLoginUrl, logout as logoutRequest } from '../../api/auth';
import { AuthContext, DEV_USER, type AuthContextValue, type AuthUser } from './AuthContext';

export function AuthProvider({
  children,
  initialUser = null,
}: {
  children: ReactNode;
  /** 테스트에서 로그인한 상태로 시작할 때 */
  initialUser?: AuthUser | null;
}) {
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [isLoading, setIsLoading] = useState(true);

  // 화면을 열 때마다 로그인 쿠키가 있는지 서버에 물어봐요.
  useEffect(() => {
    let active = true;
    getMe()
      .then((me) => {
        // 확인하는 사이에 개발용 로그인을 했으면 그대로 둬요.
        if (active) setUser((prev) => prev ?? me);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoggedIn: user !== null,
      isLoading,
      loginWithGoogle: () => {
        window.location.href = googleLoginUrl();
      },
      logout: async () => {
        try {
          await logoutRequest();
        } finally {
          setUser(null);
        }
      },
      // 개발 서버(npm run dev)에서만 있어요. 배포 빌드에는 없어요.
      devLogin: import.meta.env.DEV ? () => setUser(DEV_USER) : undefined,
    }),
    [user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
