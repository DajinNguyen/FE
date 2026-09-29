import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import type { CompanySummary } from '../types';
import { useToast } from './useToast';

/** 회사를 누르면 리포트 화면으로 이동해요. 리포트가 없는 회사는 안내만 보여줘요. */
export function useOpenCompany() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  return useCallback(
    (company: CompanySummary) => {
      if (company.has_report) navigate(`/companies/${company.stock_code}`);
      else showToast('시연에서는 삼성전자 리포트만 준비되어 있어요');
    },
    [navigate, showToast],
  );
}
