import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { getMe, googleLoginUrl, logout as logoutRequest } from '../../api/auth';
import { AuthContext, type AuthContextValue, type AuthUser } from './AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 화면을 열 때마다 로그인 쿠키가 있는지 서버에 물어봐요.
  useEffect(() => {
    let active = true;
    getMe()
      .then((me) => {
        if (active) setUser(me);
      })
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
        await logoutRequest();
        setUser(null);
      },
    }),
    [user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
