import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { generateReport, getSavedReport } from '../api/companies';

/**
 * checking   : 저장된 리포트가 있는지 확인하는 중
 * idle       : 아직 리포트가 없어요 ("AI 리포트 작성" 버튼을 기다려요)
 * generating : AI가 리포트를 쓰는 중
 * ready      : 리포트가 있어요
 * error      : 확인 또는 생성에 실패했어요
 */
export type ReportStatus = 'checking' | 'idle' | 'generating' | 'ready' | 'error';

const savedReportKey = (stockCode: string) => ['companies', stockCode, 'report'] as const;

/**
 * AI 리포트의 "작성 요청 → 생성 → 보기" 흐름을 한곳에서 관리해요.
 * CompanyPage 에서 한 번만 호출하고, 하단 버튼과 리포트 탭에 같은 값을 내려줘요.
 */
export function useReportFlow(stockCode: string) {
  const queryClient = useQueryClient();

  const saved = useQuery({
    queryKey: savedReportKey(stockCode),
    queryFn: () => getSavedReport(stockCode),
    // 화면을 다시 열 때마다 서버에 저장된 리포트가 있는지 물어봐요.
    gcTime: 0,
    staleTime: Infinity,
  });

  const {
    mutate,
    data: generated,
    isPending,
    isError: isGenerateError,
    error: generateError,
  } = useMutation({
    mutationFn: () => generateReport(stockCode),
    onSuccess: (report) => queryClient.setQueryData(savedReportKey(stockCode), report),
  });

  /** 생성 과정을 새로 보여줄 때마다 바뀌는 번호 (요약 카드 애니메이션 초기화용) */
  const [runId, setRunId] = useState(0);

  const report = generated ?? saved.data ?? null;
  const status: ReportStatus = isPending
    ? 'generating'
    : isGenerateError
      ? 'error'
      : report
        ? 'ready'
        : saved.isPending
          ? 'checking'
          : saved.isError
            ? 'error'
            : 'idle';

  /** 이번에 새로 만든 게 아니라, 서버에 저장돼 있던 리포트를 바로 불러온 경우 */
  const fromCache = !generated && Boolean(saved.data);

  const run = useCallback(() => {
    setRunId((n) => n + 1);
    mutate();
  }, [mutate]);

  /** 리포트가 없을 때만 새로 만들어요. 이미 있거나 만드는 중이면 아무것도 하지 않아요. */
  const start = useCallback(() => {
    if (status === 'idle' || status === 'error') run();
  }, [status, run]);

  return {
    status,
    report,
    fromCache,
    runId,
    error: generateError ?? saved.error,
    start,
    regenerate: run,
  };
}

export type ReportFlow = ReturnType<typeof useReportFlow>;
