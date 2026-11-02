import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reportTarget } from '../api/community';
import { ApiError } from '../api/errors';
import type { ReportInput } from '../types';
import { communityKeys } from './communityKeys';
import { useToast } from './useToast';
import { useViewerId } from './useViewerId';

/** 글·댓글 신고. 같은 대상은 한 번만, 끝나면 토스트로 알려요. */
export function useReport() {
  const queryClient = useQueryClient();
  const viewer = useViewerId();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (input: ReportInput) => reportTarget(input),
    onSuccess: () => {
      showToast('신고했어요. 확인 후 처리할게요.');
      // 신고 여부·숨김 상태를 새로 받아요.
      void queryClient.invalidateQueries({ queryKey: communityKeys.all(viewer) });
    },
    onError: (error) => {
      showToast(
        error instanceof ApiError && error.code === 'ALREADY_REPORTED'
          ? '이미 신고했어요. 같은 글·댓글은 한 번만 신고할 수 있어요.'
          : '신고하지 못했어요. 잠시 후 다시 시도해 주세요.',
      );
    },
  });
}
