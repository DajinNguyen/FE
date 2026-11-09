export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/** 에러 원인을 사용자에게 보여줄 문장으로 바꿔요. */
export function errorReason(error: unknown) {
  if (error instanceof ApiError) return error.message;
  return '서버에 연결하지 못했어요.';
}
