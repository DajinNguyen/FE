import { useMemo, useState, type ReactNode } from 'react';
import { AuthContext, type AuthContextValue, type AuthUser } from './AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoggedIn: user !== null,
      // TODO: Google OAuth 연결 (예: 백엔드 /api/auth/google 로 이동 → JWT 쿠키 발급 → /api/auth/me 로 user 조회)
      loginWithGoogle: async () => false,
      logout: async () => setUser(null),
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
