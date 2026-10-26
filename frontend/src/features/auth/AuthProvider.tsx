import { useMemo, useState, type ReactNode } from 'react';
import { apiConfig } from '../../api/client';
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

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoggedIn: user !== null,
      // TODO: Google OAuth 연결 (예: 백엔드 /api/auth/google 로 이동 → JWT 쿠키 발급 → /api/auth/me 로 user 조회)
      loginWithGoogle: async () => false,
      logout: async () => setUser(null),
      devLogin: apiConfig.useMock ? () => setUser(DEV_USER) : undefined,
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
