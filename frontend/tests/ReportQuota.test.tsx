import { act, renderHook, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { AuthContext } from '../src/features/auth/AuthContext';
import { useReportQuota } from '../src/hooks/useReportQuota';
import { CompanyPage } from '../src/pages/CompanyPage';
import { renderWithProviders } from './testUtils';

const renderCompanyPage = (stockCode: string) =>
  renderWithProviders(
    <Routes>
      <Route path="/companies/:stockCode" element={<CompanyPage />} />
    </Routes>,
    { route: `/companies/${stockCode}` },
  );

const today = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

describe('AI 리포트 이용 제한 (임시 정책: 비로그인 하루 1회, 로그인 3회, 같은 기업 10분)', () => {
  it('남은 횟수를 보여주고, 다 쓰면 버튼을 막고 로그인을 안내해요', async () => {
    const user = userEvent.setup();
    renderCompanyPage('000660');

    expect(await screen.findByText('오늘 1번 더 만들 수 있어요')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'AI 리포트 만들기' }));

    // 목 데이터에는 SK하이닉스 자료가 없어서 실패해요. 횟수는 이미 썼어요.
    const alert = await screen.findByRole('alert');
    expect(within(alert).getByRole('button', { name: /다시 시도/ })).toBeDisabled();
    expect(within(alert).getByText(/오늘 만들 수 있는 리포트를 다 썼어요/)).toBeInTheDocument();
    expect(within(alert).getByRole('button', { name: 'Google로 로그인' })).toBeInTheDocument();
  });

  it('같은 기업은 10분이 지나야 다시 만들 수 있고, 리포트 보기는 막지 않아요', async () => {
    window.localStorage.setItem(
      'dajin:report-usage',
      JSON.stringify({ date: '', count: 0, lastByCompany: { '005930': Date.now() } }),
    );
    renderCompanyPage('005930');

    expect(
      await screen.findByRole('region', { name: '지금 어떤 상황인가요?' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다시 만들기' })).toBeDisabled();
    expect(screen.getByText(/같은 기업은 10분마다 만들 수 있어요/)).toBeInTheDocument();
  });

  it('로그인 사용자는 하루 3번까지, 다 쓰면 "내일 다시"로 안내해요', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthContext.Provider
        value={{
          user: { id: 'u1', email: 'test@example.com', name: '테스트', nickname: '테스트' },
          isLoggedIn: true,
          isChecking: false,
          loginWithGoogle: async () => true,
          logout: async () => {},
        }}
      >
        {children}
      </AuthContext.Provider>
    );
    window.localStorage.setItem(
      'dajin:report-usage',
      JSON.stringify({ date: today(), count: 2, lastByCompany: {} }),
    );
    const { result } = renderHook(() => useReportQuota('000660'), { wrapper });

    expect(result.current.limit).toBe(3);
    expect(result.current.remaining).toBe(1);
    act(() => result.current.consume());
    expect(result.current.remaining).toBe(0);
    expect(result.current.blocked).toBe('member-daily');
  });
});
