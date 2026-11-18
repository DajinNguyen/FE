import { act, renderHook, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from '../src/App';
import { DEV_USER } from '../src/features/auth/AuthContext';
import { useAuth } from '../src/hooks/useAuth';
import { useMockPortfolio } from '../src/hooks/useMockInvest';
import { serverMockInvest } from './fixtures/mockInvest';
import { serverWallet } from './fixtures/wallet';
import { providersWrapper, renderWithProviders } from './testUtils';

type User = ReturnType<typeof userEvent.setup>;

/** 주문 칸에서 기업을 찾아 고르기 */
async function chooseCompany(user: User, query: string, name: string) {
  const order = await screen.findByRole('region', { name: '주문' });
  await user.type(within(order).getByRole('combobox'), query);
  await user.click(await within(order).findByRole('option', { name: new RegExp(name) }));
  return within(order).findByRole('form', { name: `${name} 주문` });
}

describe('모의투자 화면', () => {
  it('비로그인으로 들어오면 로그인 시트를 띄워요', async () => {
    renderWithProviders(<App />, { route: '/mock-invest' });
    expect(
      await screen.findByRole('dialog', { name: '로그인하면 모의투자를 할 수 있어요' }),
    ).toBeInTheDocument();
  });

  it('내 자산: 가상 현금 = 앰똥깡 × 1만 원, 지연 시세 기준', async () => {
    renderWithProviders(<App />, { route: '/mock-invest', user: DEV_USER });
    const assets = await screen.findByRole('region', { name: '내 자산' });
    expect(assets).toHaveTextContent('총 자산500,000원');
    expect(assets).toHaveTextContent('가상 현금500,000원50 ADK');
    expect(assets).toHaveTextContent('1 ADK = 가상 10,000원');
    expect(assets).toHaveTextContent('지연 시세 기준');
    expect(screen.getByRole('region', { name: '보유 종목 0개' })).toHaveTextContent(
      '아직 가진 종목이 없어요',
    );
  });

  it('사기: 예상 금액 → 화면 안 확인 단계 → 체결, 앰똥깡이 빠지고 보유·내역에 보여요', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/mock-invest', user: DEV_USER });
    const form = await chooseCompany(user, '삼성전자', '삼성전자');
    expect(form).toHaveTextContent('사기 전에 이 기업의 최근 실적을 확인해 보세요');
    expect(within(form).getByRole('link', { name: 'AI 리포트 보기' })).toHaveAttribute(
      'href',
      '/companies/005930?tab=analysis',
    );

    const quantity = within(form).getByLabelText('수량');
    await user.clear(quantity);
    await user.type(quantity, '2');
    expect(form).toHaveTextContent('예상 금액 257,000원 (25.7 ADK)');

    await user.click(within(form).getByRole('button', { name: '주문 확인' }));
    const confirm = within(form).getByRole('group', { name: '주문 확인' });
    expect(confirm).toHaveTextContent('삼성전자 2주를 살까요?');
    // 확인 단계 전에는 서버에 보내지 않아요
    expect(serverMockInvest.trades(DEV_USER.id!)).toHaveLength(0);

    await user.click(within(confirm).getByRole('button', { name: '사기 확정' }));
    expect(await screen.findByText(/체결됐어요/)).toHaveTextContent(
      '체결됐어요 · 삼성전자 2주 사기 · 1주 128,500원 · 257,000원 (25.7 ADK)',
    );
    expect(serverWallet.get(DEV_USER.id!)?.balance).toBe(24.3);
    expect(await screen.findByRole('button', { name: '내 앰똥깡 24 ADK' })).toBeInTheDocument();

    const holdings = screen.getByRole('region', { name: '보유 종목 1개' });
    expect(within(holdings).getByRole('link', { name: '삼성전자' })).toHaveAttribute(
      'href',
      '/companies/005930',
    );
    expect(holdings).toHaveTextContent('수량2주');
    expect(holdings).toHaveTextContent('평균 가격128,500원');
    const trades = screen.getByRole('region', { name: '거래 내역' });
    expect(await within(trades).findByRole('cell', { name: '사기' })).toBeInTheDocument();
    expect(within(trades).getByRole('cell', { name: '2주' })).toBeInTheDocument();
  });

  it('돌아가기를 누르면 주문하지 않아요', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/mock-invest', user: DEV_USER });
    const form = await chooseCompany(user, '삼성전자', '삼성전자');
    await user.click(within(form).getByRole('button', { name: '주문 확인' }));
    await user.click(within(form).getByRole('button', { name: '돌아가기' }));
    expect(within(form).queryByRole('group', { name: '주문 확인' })).not.toBeInTheDocument();
    expect(serverMockInvest.trades(DEV_USER.id!)).toHaveLength(0);
    expect(serverWallet.get(DEV_USER.id!)?.balance).toBe(50);
  });

  it('가상 현금보다 비싸면 주문 확인을 막고, 가진 것보다 많이 팔 수 없어요', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/mock-invest', user: DEV_USER });
    const form = await chooseCompany(user, '삼성바이오로직스', '삼성바이오로직스');
    expect(form).toHaveTextContent('최대 0주');
    expect(within(form).getByRole('alert')).toHaveTextContent('가상 현금(앰똥깡)이 부족해요');
    expect(within(form).getByRole('button', { name: '주문 확인' })).toBeDisabled();

    await user.click(within(form).getByRole('radio', { name: '팔기' }));
    expect(within(form).getByRole('alert')).toHaveTextContent('가진 주식이 없어서 팔 수 없어요');
    expect(within(form).getByRole('button', { name: '주문 확인' })).toBeDisabled();
  });

  it('팔기: 판 금액만큼 앰똥깡이 돌아와요', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/mock-invest', user: DEV_USER });
    const form = await chooseCompany(user, '삼성전자', '삼성전자');
    await user.click(within(form).getByRole('button', { name: '주문 확인' }));
    await user.click(within(form).getByRole('button', { name: '사기 확정' }));
    await screen.findByText(/체결됐어요/);
    await waitFor(() => expect(serverWallet.get(DEV_USER.id!)?.balance).toBe(37.15));

    await user.click(within(form).getByRole('radio', { name: '팔기' }));
    expect(form).toHaveTextContent('가진 수량 1주');
    await user.click(within(form).getByRole('button', { name: '주문 확인' }));
    await user.click(within(form).getByRole('button', { name: '팔기 확정' }));
    await waitFor(() =>
      expect(screen.getByText(/체결됐어요/)).toHaveTextContent('삼성전자 1주 팔기'),
    );
    expect(serverWallet.get(DEV_USER.id!)?.balance).toBe(50);
    expect(await screen.findByRole('region', { name: '보유 종목 0개' })).toBeInTheDocument();
  });

  it('다른 사용자와의 수익률 순위·초기화 버튼은 없어요', async () => {
    renderWithProviders(<App />, { route: '/mock-invest', user: DEV_USER });
    await screen.findByRole('region', { name: '내 자산' });
    expect(screen.queryByText(/순위|랭킹/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /초기화/ })).not.toBeInTheDocument();
  });
});

describe('로그아웃하면 모의투자 데이터도 비워요', () => {
  it('자산 쿼리를 지우고, 다시 로그인하면 서버에서 새로 불러와요', async () => {
    const { result } = renderHook(() => ({ auth: useAuth(), mock: useMockPortfolio() }), {
      wrapper: providersWrapper(DEV_USER),
    });
    await waitFor(() => expect(result.current.mock.data?.cash).toBe(500_000));

    await act(() => result.current.auth.logout());
    expect(result.current.mock.data).toBeUndefined();

    act(() => result.current.auth.devLogin!());
    await waitFor(() => expect(result.current.mock.data?.cash).toBe(500_000));
  });
});
