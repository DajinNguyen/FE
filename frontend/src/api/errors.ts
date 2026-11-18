export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  /** 에러 응답의 나머지 칸 (예: retry_after, held, required, balance) */
  readonly details: Record<string, unknown>;

  constructor(
    message: string,
    status: number,
    code?: string,
    details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** details 의 숫자 칸 (없거나 숫자가 아니면 undefined) */
  number(key: string) {
    const value = this.details[key];
    return typeof value === 'number' ? value : undefined;
  }
}

/** 에러 원인을 사용자에게 보여줄 문장으로 바꿔요. */
export function errorReason(error: unknown) {
  if (error instanceof ApiError) return error.message;
  return '서버에 연결하지 못했어요.';
}
