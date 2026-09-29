import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api/errors';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 404 같은 요청 오류는 다시 시도해도 같으니 재시도하지 않아요.
        retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 2,
        refetchOnWindowFocus: false,
      },
    },
  });
}
