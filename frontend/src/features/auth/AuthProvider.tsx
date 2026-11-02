import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { getMe, googleLoginUrl, logout as logoutRequest } from '../../api/auth';
import { apiConfig } from '../../api/client';
import { setSessionUser } from '../../api/session';
import { useToast } from '../../hooks/useToast';
import {
  AuthContext,
  DEV_USER,
  displayName,
  type AuthContextValue,
  type AuthUser,
} from './AuthContext';

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
  const { showToast } = useToast();
  // 목 서버가 "내 글"을 알 수 있게 지금 사용자를 알려줘요. (실제 서버는 로그인 쿠키로 알아요)
  setSessionUser(user ? { id: user.id ?? user.email, nickname: displayName(user) } : null);

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
        if (apiConfig.useMock) {
          showToast('목 데이터 모드에서는 Google 로그인 대신 [개발용 로그인]으로 확인해 주세요.');
          return;
        }
        window.location.href = googleLoginUrl();
      },
      logout: async () => {
        try {
          await logoutRequest();
        } finally {
          setUser(null);
        }
      },
      devLogin: apiConfig.useMock ? () => setUser(DEV_USER) : undefined,
    }),
    [user, isLoading, showToast],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
