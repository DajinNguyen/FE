import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { generateReport, getCompanyReport } from '../api/companies';
import type { CompanyReport } from '../types';
import { useToast } from './useToast';

/**
 * 화면에서 구분하는 리포트 상태
 * checking   : 처음 불러오는 중
 * none       : 아직 리포트가 없어요
 * generating : AI가 만드는 중 (기존 리포트가 있으면 그대로 보여줘요)
 * done       : 리포트가 있어요
 * failed     : 만들지 못했어요 (기존 리포트가 있으면 done 으로 두고 토스트만 띄워요)
 */
export type ReportView = 'checking' | 'none' | 'generating' | 'done' | 'failed';

/** 생성 중일 때 상태를 다시 물어보는 간격 */
const POLL_MS = 2000;
/** 화면에 안내하는 예상 시간 */
export const ESTIMATED_SECONDS = 15;

const reportKey = (stockCode: string) => ['companies', stockCode, 'report'] as const;

/**
 * AI 리포트의 "확인 → 만들기 → 기다리기 → 보기" 흐름을 한곳에서 관리해요.
 * CompanyPage 에서 한 번만 호출하고, 필요한 화면에 같은 값을 내려줘요.
 */
export function useCompanyReport(stockCode: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [cancelled, setCancelled] = useState(false);

  const query = useQuery({
    queryKey: reportKey(stockCode),
    queryFn: () => getCompanyReport(stockCode),
    // 화면을 다시 열 때마다 서버에 지금 상태를 물어봐요.
    gcTime: 0,
    staleTime: Infinity,
    refetchInterval: (q) => (!cancelled && q.state.data?.status === 'generating' ? POLL_MS : false),
  });

  const mutation = useMutation({
    mutationFn: () => generateReport(stockCode),
    onSuccess: (report) => queryClient.setQueryData(reportKey(stockCode), report),
  });

  const data = query.data;

  // 마지막으로 성공한 리포트 내용. 서버는 다시 만드는 중이거나 실패해도 이전 내용을 함께 보내요.
  const [lastReport, setLastReport] = useState<CompanyReport | null>(null);
  if (data && data.key_points.length > 0 && data !== lastReport) setLastReport(data);

  // 이번 화면에서 직접 만들기를 눌렀는지 (실패 토스트는 이때만 띄워요)
  const [requested, setRequested] = useState(false);

  const generating = !cancelled && (mutation.isPending || data?.status === 'generating');

  // 생성을 처음 본 시각 (경과 시간 표시용)
  const [startedAt, setStartedAt] = useState<number | null>(null);
  if (generating && startedAt === null) setStartedAt(Date.now());
  if (!generating && startedAt !== null) setStartedAt(null);

  const failed = mutation.isError || query.isError || data?.status === 'failed';
  const failureReason =
    data?.failure_reason ??
    (mutation.error ?? query.error)?.message ??
    '잠시 후 다시 시도해 주세요.';

  let view: ReportView;
  if (generating) view = 'generating';
  else if (query.isPending) view = 'checking';
  else if (lastReport) view = 'done';
  else if (failed) view = 'failed';
  else view = 'none';

  // 다시 만들기가 실패하면 기존 리포트는 그대로 두고 알려만 줘요.
  const regenerateFailed = requested && !generating && Boolean(lastReport) && failed;
  useEffect(() => {
    if (regenerateFailed) showToast('리포트를 다시 만들지 못했어요. 기존 리포트를 보여드릴게요.');
  }, [regenerateFailed, showToast]);

  const { mutate } = mutation;
  const generate = useCallback(() => {
    setCancelled(false);
    setRequested(true);
    mutate();
  }, [mutate]);

  /** 기다리기를 멈춰요. (서버 작업 취소 API가 생기면 여기서 함께 불러요) */
  const cancel = useCallback(() => setCancelled(true), []);

  return {
    view,
    report: lastReport,
    isRegenerating: generating && lastReport !== null,
    startedAt,
    failureReason,
    generate,
    cancel,
  };
}

export type CompanyReportFlow = ReturnType<typeof useCompanyReport>;
