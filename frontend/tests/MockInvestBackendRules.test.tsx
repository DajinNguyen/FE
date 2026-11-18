import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from '../src/App';
import { ApiError } from '../src/api/errors';
import { request } from '../src/api/client';
import { DEV_USER } from '../src/features/auth/AuthContext';
import { limitMockOrders } from './fixtures/mockInvest';
import { setSessionUser } from './fixtures/session';
import { renderWithProviders } from './testUtils';

type User = ReturnType<typeof userEvent.setup>;

async function chooseCompany(user: User, name: string) {
  const order = await screen.findByRole('region', { name: '주문' });
  await user.type(within(order).getByRole('combobox'), name);
  await user.click(await within(order).findByRole('option', { name: new RegExp(name) }));
  return within(order).findByRole('form', { name: `${name} 주문` });
}

async function buy(user: User, form: HTMLElement) {
  await user.click(within(form).getByRole('button', { name: '주문 확인' }));
  await user.click(within(form).getByRole('button', { name: '사기 확정' }));
}

describe('모의투자 백엔드 규칙 반영', () => {
  it('지갑 시트 내역은 소수 ADK 를 그대로 보여줘요 (25.7 ADK)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/mock-invest', user: DEV_USER });
    const form = await chooseCompany(user, '삼성전자');
    await user.clear(within(form).getByLabelText('수량'));
    await user.type(within(form).getByLabelText('수량'), '2');
    await buy(user, form);
    await screen.findByText(/체결됐어요/);

    await user.click(await screen.findByRole('button', { name: '내 앰똥깡 24 ADK' }));
    const sheet = await screen.findByRole('dialog', { name: '내 앰똥깡' });
    expect(
      within(sheet)
        .getByText(/모의투자 · 삼성전자 2주 사기/)
        .closest('li'),
    ).toHaveTextContent('−25.7 ADK');
  });

  it('주문 횟수 제한(429)은 몇 초 뒤에 다시 하라고 알려요', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/mock-invest', user: DEV_USER });
    const form = await chooseCompany(user, '삼성전자');
    limitMockOrders(12);
    await buy(user, form);
    expect(await screen.findByText(/주문이 너무 잦아요/)).toHaveTextContent(
      '주문이 너무 잦아요. 12초 뒤에 다시 해 주세요. 앰똥깡은 빠지지 않았어요',
    );
  });

  it('보유 종목이 생기면 지연 시세 기준 시각을 보여줘요 (없으면 null 이라 숨겨요)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/mock-invest', user: DEV_USER });
    const assets = await screen.findByRole('region', { name: '내 자산' });
    expect(assets).not.toHaveTextContent('지연 시세 기준');
    expect(assets).toHaveTextContent(/1 ADK = 가상 10,000원$/);
    await buy(user, await chooseCompany(user, '삼성전자'));
    await screen.findByText(/체결됐어요/);
    expect(await within(assets).findByText(/지연 시세 기준/)).toBeInTheDocument();
  });

  it('에러 응답의 추가 칸(held, retry_after …)을 읽어요', async () => {
    setSessionUser({ id: DEV_USER.id!, nickname: '개발용 사용자' });
    const error = await request({
      path: '/api/me/mock-invest/orders',
      method: 'POST',
      body: { stock_code: '005930', side: 'sell', quantity: 1 },
    }).catch((e: unknown) => e);
    // 가진 주식 없이 팔면 400 INSUFFICIENT_QUANTITY + held(지금 가진 수량)
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe('INSUFFICIENT_QUANTITY');
    expect((error as ApiError).number('held')).toBe(0);

    const typed = new ApiError('x', 400, 'INSUFFICIENT_QUANTITY', { held: 3 });
    expect(typed.number('held')).toBe(3);
    expect(typed.number('missing')).toBeUndefined();
  });
});
