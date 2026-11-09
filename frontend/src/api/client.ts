import { ApiError } from './errors';

/**
 * 모든 요청은 실제 백엔드(VITE_API_BASE_URL)로 가요.
 * 주소와 응답 형식은 docs/frontend-data-requirements.md 에 정리돼 있어요.
 */
export const apiConfig = {
  baseUrl: (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, ''),
};

interface RequestOptions {
  /** 실제 API 경로 (예: /api/companies?query=삼성) */
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
}

export async function request<T>({ path, method = 'GET', body }: RequestOptions): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiConfig.baseUrl}${path}`, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'include',
    });
  } catch {
    // 서버가 꺼져 있거나 인터넷이 끊긴 경우
    throw new ApiError('서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.', 0, 'NETWORK_ERROR');
  }

  if (!response.ok) {
    // 에러 응답은 { error: { code, message } } 형식이에요. (예전 형식 { detail, code } 도 읽어요)
    let body:
      { error?: { code?: string; message?: string }; detail?: string; code?: string } | undefined;
    try {
      body = await response.json();
    } catch {
      body = undefined;
    }
    throw new ApiError(
      body?.error?.message ?? body?.detail ?? `요청을 처리하지 못했어요 (${response.status})`,
      response.status,
      body?.error?.code ?? body?.code,
    );
  }

  if (response.status === 204) return undefined as T;
  // 백엔드가 아직 없으면 개발 서버가 JSON 대신 HTML 을 돌려줘요.
  if (!response.headers.get('content-type')?.includes('json')) {
    throw new ApiError('아직 서버에서 자료를 받을 수 없어요.', response.status, 'NOT_JSON');
  }
  return (await response.json()) as T;
}
