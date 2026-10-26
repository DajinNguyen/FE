import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useSearchParams } from 'react-router';
import { browser, getMe, googleLoginUrl, logout as requestLogout } from '../../api/auth';
import { apiConfig, onUnauthorized } from '../../api/client';
import { setSessionUser } from '../../api/session';
import { useToast } from '../../hooks/useToast';
import {
  AuthContext,
  DEV_USER,
  loginErrorMessages,
  type AuthContextValue,
  type AuthUser,
} from './AuthContext';

/**
 * 로그인 흐름 (실제 API 모드)
 * 1. [Google로 로그인] → 백엔드 /api/auth/google/login?redirect=지금 화면 으로 이동
 * 2. 백엔드가 Google 로그인을 마치고 로그인 쿠키(JWT)를 심은 뒤 redirect 로 돌려보내요
 * 3. 앱이 다시 열리면 /api/auth/me 로 사용자를 확인해요
 */
export function AuthProvider({
  children,
  initialUser = null,
}: {
  children: ReactNode;
  /** 테스트에서 로그인한 상태로 시작할 때 */
  initialUser?: AuthUser | null;
}) {
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [isChecking, setIsChecking] = useState(() => !apiConfig.useMock && initialUser === null);
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  // 목 서버가 "내 글"을 알 수 있게 지금 사용자를 알려줘요. (실제 서버는 로그인 쿠키로 알아요)
  setSessionUser(user);

  useEffect(() => {
    if (!isChecking) return;
    let alive = true;
    getMe()
      .then((me) => alive && setUser(me))
      .catch(() => alive && setUser(null))
      .finally(() => alive && setIsChecking(false));
    return () => {
      alive = false;
    };
  }, [isChecking]);

  // 로그인 쿠키가 만료돼 401 을 받으면 로그아웃 상태로 바꿔요.
  useEffect(() => onUnauthorized(() => setUser(null)), []);

  // 로그인에 실패하고 돌아오면 안내하고 주소에서 지워요.
  const loginError = searchParams.get('login_error');
  useEffect(() => {
    if (!loginError) return;
    showToast(loginErrorMessages[loginError] ?? loginErrorMessages.failed);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('login_error');
        return next;
      },
      { replace: true },
    );
  }, [loginError, showToast, setSearchParams]);

  const redirect = `${location.pathname}${location.search}`;
  const loginWithGoogle = useCallback(async () => {
    if (apiConfig.useMock) return false;
    browser.go(googleLoginUrl(redirect));
    return true;
  }, [redirect]);

  const logout = useCallback(async () => {
    if (!apiConfig.useMock) {
      try {
        await requestLogout();
      } catch {
        // 서버 쿠키를 못 지워도 화면은 로그아웃 상태로 바꿔요.
      }
    }
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoggedIn: user !== null,
      isChecking,
      loginWithGoogle,
      logout,
      devLogin: apiConfig.useMock ? () => setUser(DEV_USER) : undefined,
    }),
    [user, isChecking, loginWithGoogle, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
