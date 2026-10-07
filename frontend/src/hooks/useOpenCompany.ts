import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import type { CompanySummary } from '../types';
import { useRecentSearches } from './useRecentSearches';

/** 기업을 고르면 최근 검색에 남기고 기업 화면으로 이동해요. 리포트는 그 화면에서 요청해요. */
export function useOpenCompany() {
  const navigate = useNavigate();
  const { add } = useRecentSearches();

  return useCallback(
    (company: Pick<CompanySummary, 'stock_code' | 'name'>) => {
      add(company);
      navigate(`/companies/${company.stock_code}`);
    },
    [navigate, add],
  );
}
