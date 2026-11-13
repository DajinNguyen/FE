import { act, renderHook, screen } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { DEV_USER } from '../src/features/auth/AuthContext';
import { useReportQuota } from '../src/hooks/useReportQuota';
import { CompanyPage } from '../src/pages/CompanyPage';
import { providersWrapper, renderWithProviders } from './testUtils';

const renderCompanyPage = (stockCode: string) =>
  renderWithProviders(
    <Routes>
      <Route path="/companies/:stockCode" element={<CompanyPage />} />
    </Routes>,
    { route: `/companies/${stockCode}?tab=analysis` },
  );

const today = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

describe('AI 리포트 이용 제한 (임시 정책: 하루 횟수 제한 없음, 같은 기업 간격 제한 없음)', () => {
  it('하루 횟수 제한이 없어서 남은 횟수 안내를 보여주지 않아요', async () => {
    renderCompanyPage('000660');

    expect(await screen.findByRole('button', { name: 'AI 리포트 만들기' })).toBeInTheDocument();
    expect(screen.queryByText(/오늘.*번 더 만들 수 있어요/)).not.toBeInTheDocument();
    expect(screen.queryByText(/오늘 만들 수 있는 리포트를 다 썼어요/)).not.toBeInTheDocument();
  });

  it('같은 기업도 바로 다시 만들 수 있어요 (간격 제한 없음)', async () => {
    renderCompanyPage('005930');

    expect(
      await screen.findByRole('region', { name: '지금 어떤 상황인가요?' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다시 만들기' })).toBeEnabled();
    expect(screen.queryByText(/분마다 만들 수 있어요/)).not.toBeInTheDocument();
  });

  it('로그인 사용자도 하루 횟수 제한 없이 계속 만들 수 있어요', () => {
    const wrapper = providersWrapper(DEV_USER);
    window.localStorage.setItem('dajin:report-usage', JSON.stringify({ date: today(), count: 2 }));
    const { result } = renderHook(() => useReportQuota(), { wrapper });

    expect(result.current.limit).toBe(Infinity);
    expect(result.current.remaining).toBe(Infinity);
    act(() => result.current.consume());
    expect(result.current.remaining).toBe(Infinity);
    expect(result.current.blocked).toBeNull();
  });
});
