import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from '../src/App';
import { DEV_USER } from '../src/features/auth/AuthContext';
import { serverMockInvest } from './fixtures/mockInvest';
import { renderWithProviders } from './testUtils';

type User = ReturnType<typeof userEvent.setup>;
const card = () => screen.getByRole('region', { name: '모의투자' });

/** 주문 칸에서 기업을 찾아 고르기 */
async function chooseCompany(user: User, query: string, name: string) {
  const order = await screen.findByRole('region', { name: '주문' });
  await user.type(within(order).getByRole('combobox'), query);
  await user.click(await within(order).findByRole('option', { name: new RegExp(name) }));
  return within(order).findByRole('form', { name: `${name} 주문` });
}

describe('메인 모의투자 카드', () => {
  it('비로그인: 로그인 안내, 누르면 로그인 시트', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/' });
    expect(within(card()).getByText('로그인하면 모의투자를 할 수 있어요')).toBeInTheDocument();
    expect(within(card()).getByText('실제 돈이 아니에요')).toBeInTheDocument();
    await user.click(within(card()).getByRole('button'));
    expect(
      screen.getByRole('dialog', { name: '로그인하면 모의투자를 할 수 있어요' }),
    ).toBeInTheDocument();
  });

  it('로그인 + 시작 안 함: 앰똥깡을 환전해서 시작하기 → /mock-invest', async () => {
    renderWithProviders(<App />, { route: '/', user: DEV_USER });
    const link = await within(card()).findByRole('link', { name: /시작하기/ });
    expect(link).toHaveTextContent('앰똥깡을 가상 현금으로 환전해서 모의투자를 시작해 보세요');
    expect(link).toHaveAttribute('href', '/mock-invest');
  });

  it('로그인 + 시작함: 총 자산·수익률·보유 종목 수·오늘 변화', async () => {
    const user = userEvent.setup();
    serverMockInvest.setCash(DEV_USER.id!, 500_000); // 50 ADK 를 환전해 둔 상태
    renderWithProviders(<App />, { route: '/mock-invest', user: DEV_USER });
    const form = await chooseCompany(user, '삼성전자', '삼성전자');
    await user.click(within(form).getByRole('button', { name: /^(매수|매도) 주문$/ }));
    await user.click(within(form).getByRole('button', { name: '매수 확정' }));
    await screen.findByText(/체결됐어요/);

    await user.click(screen.getByRole('link', { name: '다진 홈' }));
    const link = await within(card()).findByRole('link', { name: /모의투자 하러 가기/ });
    // 환전한 500,000원 → 삼성전자 1주(128,500원) 산 뒤에도 총 자산은 500,000원
    expect(link).toHaveTextContent('총 자산500,000원');
    expect(link).toHaveTextContent('보유 종목1개');
    expect(link).toHaveTextContent('수익률0.00%');
  });
});
