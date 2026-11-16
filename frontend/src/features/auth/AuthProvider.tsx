import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { getMe, googleLoginUrl, logout as logoutRequest } from '../../api/auth';
import { adoptGuestData, resetUserData, runBeforeLogout, userScope } from '../../hooks/userData';
import { AuthContext, DEV_USER, type AuthContextValue, type AuthUser } from './AuthContext';

const DEV_LOGIN_ENABLED =
  import.meta.env.MODE === 'test' ||
  (import.meta.env.DEV && import.meta.env.VITE_DEV_LOGIN === 'true');

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
  const queryClient = useQueryClient();
  const scope = userScope(user);

  // 로그인하면 비로그인 때 기기에 남긴 기록(관심 기업 등)을 계정으로 합쳐요.
  useEffect(() => {
    adoptGuestData(scope);
  }, [scope]);

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
        // 아직 서버에 못 보낸 기록이 있으면 로그인 상태일 때 먼저 보내 봐요.
        await runBeforeLogout(scope);
        try {
          await logoutRequest();
        } finally {
          // 화면을 비로그인으로 바꾸고 같은 순간에 계정 데이터를 비워요. (다시 불러오지 않게)
          setUser(null);
          resetUserData(queryClient, scope);
        }
      },
      // 화면만 로그인 상태로 바꾸는 버튼이라 서버에 쓰면 401 이 나요.
      // 그래서 기본은 꺼 두고, 개발 서버에서 VITE_DEV_LOGIN=true 일 때(와 테스트)만 보여요.
      devLogin: DEV_LOGIN_ENABLED ? () => setUser(DEV_USER) : undefined,
    }),
    [user, isLoading, scope, queryClient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
