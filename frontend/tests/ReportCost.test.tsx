import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { DEV_USER, type AuthUser } from '../src/features/auth/AuthContext';
import { CompanyPage } from '../src/pages/CompanyPage';
import { serverWallet } from './fixtures/wallet';
import { renderWithProviders } from './testUtils';

const renderAnalysis = (stockCode: string, user: AuthUser | null = null) =>
  renderWithProviders(
    <Routes>
      <Route path="/companies/:stockCode" element={<CompanyPage />} />
    </Routes>,
    { route: `/companies/${stockCode}?tab=analysis`, user },
  );

describe('AI 리포트 만들기 = 7 ADK', () => {
  it('비로그인도 이미 만들어진 리포트는 볼 수 있어요', async () => {
    renderAnalysis('005930');
    expect(
      await screen.findByRole('region', { name: '지금 어떤 상황인가요?' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다시 만들기 · 7 ADK' })).toBeEnabled();
  });

  it('비로그인으로 만들기를 누르면 가입 선물 안내 로그인 시트가 떠요 (만들지 않아요)', async () => {
    const user = userEvent.setup();
    renderAnalysis('000660');
    await user.click(await screen.findByRole('button', { name: 'AI 리포트 만들기 · 7 ADK' }));

    const sheet = screen.getByRole('dialog', {
      name: 'Google로 로그인하면 가입 선물로 50 ADK를 드려요',
    });
    expect(within(sheet).getByRole('button', { name: 'Google로 로그인' })).toBeInTheDocument();
    expect(within(sheet).getByText(/실제 돈이 아니며 구매·환전할 수 없어요/)).toBeInTheDocument();
    expect(screen.getByText('아직 이 기업의 리포트가 없어요')).toBeInTheDocument();
  });

  it('로그인하면 버튼에 비용과 잔액을 보여주고, 만들면 서버가 뺀 잔액으로 바로 바뀌어요', async () => {
    const user = userEvent.setup();
    renderAnalysis('005930', DEV_USER);
    expect(await screen.findByText('내 잔액 50 ADK')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '다시 만들기 · 7 ADK' }));
    expect(await screen.findByText('내 잔액 43 ADK')).toBeInTheDocument();
    expect(serverWallet.get(DEV_USER.id!)?.history[0]).toMatchObject({
      type: 'spend',
      amount: 7,
      reason: 'AI 리포트 · 삼성전자',
    });
  });

  it('만들기에 실패하면 서버가 되돌려 주고 "돌려드렸어요"라고 알려요', async () => {
    const user = userEvent.setup();
    renderAnalysis('000660', DEV_USER);
    await screen.findByText('내 잔액 50 ADK');
    await user.click(screen.getByRole('button', { name: 'AI 리포트 만들기 · 7 ADK' }));

    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText('만들지 못해서 7 ADK는 돌려드렸어요.')).toBeInTheDocument();
    await waitFor(() => expect(serverWallet.get(DEV_USER.id!)?.balance).toBe(50));
  });

  it('잔액이 7 ADK 보다 적으면 버튼을 잠그고 낱말퀴즈로 안내해요', async () => {
    serverWallet.setBalance(DEV_USER.id!, 6);
    renderAnalysis('035420', DEV_USER);

    const note = await screen.findByRole('note');
    expect(note).toHaveTextContent(
      '앰똥깡이 부족해요. 낱말퀴즈 3개를 풀면 20 ADK를 받을 수 있어요',
    );
    expect(within(note).getByRole('link', { name: '낱말퀴즈 풀러 가기' })).toHaveAttribute(
      'href',
      '/terms',
    );
    expect(screen.getByRole('button', { name: 'AI 리포트 만들기 · 7 ADK' })).toBeDisabled();
  });
});
