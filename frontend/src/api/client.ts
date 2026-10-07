import { ApiError } from './errors';

/**
 * VITE_USE_MOCK=false 로 바꾸면 모든 요청이 실제 백엔드(VITE_API_BASE_URL)로 가요.
 * 화면·훅 코드는 바꿀 필요가 없어요.
 */
export const apiConfig = {
  useMock: import.meta.env.VITE_USE_MOCK !== 'false',
  baseUrl: (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, ''),
};

interface RequestOptions<T> {
  /** 실제 API 경로 (예: /api/companies?query=삼성) */
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  /** 목 모드일 때 대신 실행할 함수 */
  mock: () => Promise<T>;
}

export async function request<T>({
  path,
  method = 'GET',
  body,
  mock,
}: RequestOptions<T>): Promise<T> {
  if (apiConfig.useMock) return mock();

  const response = await fetch(`${apiConfig.baseUrl}${path}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'include',
  });

  if (!response.ok) {
    let detail: { detail?: string; code?: string } | undefined;
    try {
      detail = await response.json();
    } catch {
      detail = undefined;
    }
    throw new ApiError(
      detail?.detail ?? `요청을 처리하지 못했어요 (${response.status})`,
      response.status,
      detail?.code,
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/** 목 서버는 필요할 때만 불러와서, 실제 API 모드에서는 번들에 섞이지 않게 해요. */
export const loadMockServer = () => import('../mocks/mockServer');
