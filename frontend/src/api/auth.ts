import { apiConfig, loadMockServer, request } from './client';
import { ApiError } from './errors';
import type { AuthUser } from '../types';

/** 지금 로그인한 사용자. 로그인 쿠키가 없거나 만료됐으면 null 이에요. */
export async function getMe(): Promise<AuthUser | null> {
  try {
    return await request<AuthUser | null>({
      path: '/api/auth/me',
      mock: async () => (await loadMockServer()).getMe(),
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

/** 로그인 쿠키를 지워요. */
export function logout() {
  return request<void>({
    path: '/api/auth/logout',
    method: 'POST',
    mock: async () => (await loadMockServer()).logout(),
  });
}

/**
 * Google 로그인을 시작하는 백엔드 주소.
 * 백엔드가 Google 로그인을 마치면 쿠키를 심고 redirect(우리 화면 경로)로 돌려보내요.
 */
export function googleLoginUrl(redirect: string) {
  return `${apiConfig.baseUrl}/api/auth/google/login?${new URLSearchParams({ redirect })}`;
}

/** 페이지 이동. 테스트에서 바꿔 끼울 수 있게 객체로 둬요. */
export const browser = {
  go: (url: string) => window.location.assign(url),
};
