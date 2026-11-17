import type { AuthUser } from '../features/auth/AuthContext';
import { apiConfig, request } from './client';
import { ApiError } from './errors';

/** 로그인 안 했으면 null (백엔드가 401을 주는 걸 정상 흐름으로 처리해요). */
export async function getMe(): Promise<AuthUser | null> {
  try {
    return await request<AuthUser | null>({
      path: '/api/auth/me',
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

export function logout() {
  return request<void>({
    path: '/api/auth/logout',
    method: 'POST',
  });
}

/**
 * 백엔드의 Google 로그인 시작 주소. 페이지 이동(리다이렉트)으로 써요 — fetch로 부르지 않아요.
 * 로그인 끝나면 지금 보던 화면(next)으로 돌아와요.
 */
export function googleLoginUrl(): string {
  const next = encodeURIComponent(window.location.href);
  return `${apiConfig.baseUrl}/api/auth/google?next=${next}`;
}

/**
 * 닉네임 바꾸기 (마이페이지). 비우면 자동 닉네임으로 돌아가요.
 * 400 INVALID_PARAM(길이·글자 규칙), 409 NICKNAME_TAKEN(이미 쓰는 닉네임)
 */
export function updateProfile(nickname: string | null) {
  return request<AuthUser>({ path: '/api/auth/me', method: 'PATCH', body: { nickname } });
}
