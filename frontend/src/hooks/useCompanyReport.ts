import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { generateReport, getCompanyReport } from '../api/companies';
import { ApiError } from '../api/errors';
import { ADK_COST, formatAdk } from '../config/currency';
import type { CompanyReport } from '../types';
import { useRequireLogin } from './useRequireLogin';
import { useToast } from './useToast';
import { useWallet } from './useWallet';

/**
 * 화면에서 구분하는 리포트 상태
 * checking   : 처음 불러오는 중
 * none       : 아직 리포트가 없어요
 * generating : AI가 만드는 중 (기존 리포트가 있으면 그대로 보여줘요)
 * done       : 리포트가 있어요
 * failed     : 만들지 못했어요 (기존 리포트가 있으면 done 으로 두고 토스트만 띄워요)
 * load-failed: 리포트 상태를 불러오지 못했어요 (서버 연결 실패 등)
 */
export type ReportView = 'checking' | 'none' | 'generating' | 'done' | 'failed' | 'load-failed';

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
  const wallet = useWallet();
  const requireLogin = useRequireLogin();
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
    onSuccess: ({ balance, ...report }) => {
      queryClient.setQueryData(reportKey(stockCode), report);
      if (typeof balance === 'number') wallet.applyBalance(balance);
    },
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

  // 리포트 상태 자체를 불러오지 못했어요 (만들기 실패와 구분해서 [다시 시도]는 다시 불러오기)
  const loadFailed = query.isError && !mutation.isPending && !mutation.isError;

  let view: ReportView;
  if (generating) view = 'generating';
  else if (query.isPending) view = 'checking';
  else if (loadFailed && !lastReport) view = 'load-failed';
  else if (lastReport) view = 'done';
  else if (failed) view = 'failed';
  else view = 'none';

  // 다시 만들기가 실패하면 기존 리포트는 그대로 두고 알려만 줘요.
  const regenerateFailed = requested && !generating && Boolean(lastReport) && failed;
  useEffect(() => {
    if (regenerateFailed) showToast('리포트를 다시 만들지 못했어요. 기존 리포트를 보여드릴게요.');
  }, [regenerateFailed, showToast]);

  // 만들기·다시 만들기 비용 (이미 만든 리포트 보기는 무료)
  const cost = ADK_COST.report;
  // 잔액을 불러오는 중에는 버튼만 잠가요. (부족 안내는 잔액을 안 뒤에)
  const balanceKnown = wallet.balance !== null;
  const shortage = wallet.isLoggedIn && balanceKnown && !wallet.canAfford(cost);
  const blocked = shortage || (wallet.isLoggedIn && !balanceKnown);

  // 직접 만들기를 눌렀는데 실패했으면 ADK 가 빠지지 않았다고 알려요.
  // 요청 자체가 실패하면 서버가 빼지 않았고, 만드는 중에 실패하면 서버가 되돌려요.
  const chargeNotice = !requested
    ? null
    : mutation.isError
      ? `${formatAdk(cost)}는 차감되지 않았어요.`
      : data?.status === 'failed'
        ? `만들지 못해서 ${formatAdk(cost)}는 돌려드렸어요.`
        : null;

  // 만들기가 끝나거나 실패하면 서버 잔액·내역을 다시 불러와요.
  const settled = requested && !generating;
  const { refetch: refetchWallet, isLoggedIn } = wallet;
  useEffect(() => {
    if (settled && isLoggedIn) void refetchWallet();
  }, [settled, isLoggedIn, refetchWallet]);

  // 잔액이 부족하다고 서버가 막으면 지갑을 새로 불러와 버튼을 잠가요.
  const insufficient =
    mutation.error instanceof ApiError && mutation.error.code === 'INSUFFICIENT_BALANCE';
  useEffect(() => {
    if (insufficient) void refetchWallet();
  }, [insufficient, refetchWallet]);

  const { mutate } = mutation;
  /**
   * 만들기·다시 만들기 (7 ADK). 비로그인은 로그인 시트(가입 선물 안내)를 띄우고,
   * 잔액이 부족하면 아무것도 하지 않아요. (버튼도 비활성화돼요)
   */
  const generate = useCallback(() => {
    if (!isLoggedIn) {
      requireLogin(undefined, 'adk');
      return;
    }
    if (blocked) return;
    setCancelled(false);
    setRequested(true);
    mutate();
  }, [isLoggedIn, blocked, requireLogin, mutate]);

  /** 기다리기를 멈춰요. (서버 작업 취소 API가 생기면 여기서 함께 불러요) */
  const cancel = useCallback(() => setCancelled(true), []);

  return {
    view,
    report: lastReport,
    isRegenerating: generating && lastReport !== null,
    startedAt,
    failureReason,
    loadError: query.error,
    reload: query.refetch,
    generate,
    cancel,
    /** 만들기 비용·잔액 (리포트 보기는 무료) */
    adk: { cost, balance: wallet.balance, isLoggedIn, shortage, blocked, chargeNotice },
  };
}

export type CompanyReportFlow = ReturnType<typeof useCompanyReport>;
