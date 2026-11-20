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

/** 50 ADK 를 가상 50만 원으로 환전해 둔 상태 (지갑은 0 ADK) */
function funded() {
  serverMockInvest.setCash(DEV_USER.id!, 500_000);
  serverWallet.setBalance(DEV_USER.id!, 0);
}

describe('모의투자 화면', () => {
  it('비로그인으로 들어오면 로그인 시트를 띄워요', async () => {
    renderWithProviders(<App />, { route: '/mock-invest' });
    expect(
      await screen.findByRole('dialog', { name: '로그인하면 모의투자를 할 수 있어요' }),
    ).toBeInTheDocument();
  });

  it('처음에는 가상 현금이 0원이고, 환전하라고 알려요', async () => {
    renderWithProviders(<App />, { route: '/mock-invest', user: DEV_USER });
    const assets = await screen.findByRole('region', { name: '내 자산' });
    expect(assets).toHaveTextContent('총 자산0원');
    expect(assets).toHaveTextContent('가상 현금0원');
    expect(assets).toHaveTextContent('앰똥깡을 가상 현금으로 환전하면');
    expect(assets).toHaveTextContent('1 ADK = 가상 10,000원');
    // 보유 종목이 없으면 서버가 시세 기준 시각을 주지 않아요 (null)
    expect(assets).not.toHaveTextContent('지연 시세 기준');
    expect(screen.getByRole('region', { name: '보유 종목 0개' })).toHaveTextContent(
      '아직 가진 종목이 없어요',
    );
  });

  it('내 자산의 환전하기: 정수 앰똥깡을 확인 단계 뒤에 가상 현금으로 바꿔요', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/mock-invest', user: DEV_USER });
    const assets = await screen.findByRole('region', { name: '내 자산' });
    await user.click(within(assets).getByRole('button', { name: '환전하기' }));
    const form = within(assets).getByRole('form', { name: '앰똥깡 환전' });
    expect(form).toHaveTextContent('가진 앰똥깡 50 ADK');

    const input = within(form).getByLabelText('환전할 앰똥깡');
    await user.type(input, '1.5');
    expect(within(form).getByRole('alert')).toHaveTextContent('1 ADK 단위로 입력해 주세요');
    await user.clear(input);
    await user.type(input, '51');
    expect(within(form).getByRole('alert')).toHaveTextContent('가진 앰똥깡(50 ADK)보다 많이');
    expect(within(form).getByRole('button', { name: '환전 확인' })).toBeDisabled();

    await user.clear(input);
    await user.type(input, '30');
    expect(form).toHaveTextContent('받는 가상 현금 300,000원');
    await user.click(within(form).getByRole('button', { name: '환전 확인' }));
    const confirm = within(form).getByRole('group', { name: '환전 확인' });
    expect(confirm).toHaveTextContent('30 ADK를 가상 300,000원으로 환전할까요?');
    expect(confirm).toHaveTextContent('다시 앰똥깡으로 바꿀 수 없어요');
    expect(serverWallet.get(DEV_USER.id!)?.balance).toBe(50); // 확인 전에는 보내지 않아요

    await user.click(within(confirm).getByRole('button', { name: '환전 확정' }));
    expect(await within(form).findByRole('status')).toHaveTextContent(
      '환전했어요 · 30 ADK → 가상 300,000원',
    );
    expect(serverWallet.get(DEV_USER.id!)?.balance).toBe(20);
    expect(assets).toHaveTextContent('총 자산300,000원= 30 ADK');
    expect(assets).toHaveTextContent('가상 현금300,000원');
    expect(await screen.findByRole('button', { name: '내 앰똥깡 20 ADK' })).toBeInTheDocument();

    // 전부: 남은 앰똥깡을 모두
    await user.click(within(form).getByRole('button', { name: '전부' }));
    expect(input).toHaveValue(20);
  });

  it('매수: 예상 금액 → 화면 안 확인 단계 → 체결, 가상 현금이 줄고(앰똥깡은 그대로) 보유·내역에 보여요', async () => {
    const user = userEvent.setup();
    funded();
    renderWithProviders(<App />, { route: '/mock-invest', user: DEV_USER });
    const form = await chooseCompany(user, '삼성전자', '삼성전자');
    expect(form).toHaveTextContent('매수하기 전에 이 기업의 최근 실적을 확인해 보세요');
    expect(within(form).getByRole('link', { name: 'AI 리포트 보기' })).toHaveAttribute(
      'href',
      '/companies/005930?tab=analysis',
    );

    const quantity = within(form).getByLabelText('수량');
    await user.clear(quantity);
    await user.type(quantity, '2');
    expect(form).toHaveTextContent('주문금액257,000원');

    await user.click(within(form).getByRole('button', { name: /^(매수|매도) 주문$/ }));
    const confirm = within(form).getByRole('group', { name: '주문 확인' });
    expect(confirm).toHaveTextContent('삼성전자 2주를 매수할까요?');
    expect(confirm).toHaveTextContent('가상 현금 500,000원 → 243,000원');
    // 확인 단계 전에는 서버에 보내지 않아요
    expect(serverMockInvest.trades(DEV_USER.id!)).toHaveLength(0);

    await user.click(within(confirm).getByRole('button', { name: '매수 확정' }));
    expect(await screen.findByText(/체결됐어요/)).toHaveTextContent(
      '체결됐어요 · 삼성전자 2주 매수 · 1주 128,500원 · 257,000원',
    );
    expect(serverMockInvest.cash(DEV_USER.id!)).toBe(243_000);
    expect(serverWallet.get(DEV_USER.id!)?.balance).toBe(0);
    expect(screen.getByRole('region', { name: '내 자산' })).toHaveTextContent('가상 현금243,000원');

    const holdings = screen.getByRole('region', { name: '보유 종목 1개' });
    expect(within(holdings).getByRole('link', { name: '삼성전자' })).toHaveAttribute(
      'href',
      '/companies/005930',
    );
    expect(holdings).toHaveTextContent('수량2주');
    expect(holdings).toHaveTextContent('평균 가격128,500원');
    const trades = screen.getByRole('region', { name: '거래 내역' });
    expect(await within(trades).findByRole('cell', { name: '매수' })).toBeInTheDocument();
    expect(within(trades).getByRole('cell', { name: '2주' })).toBeInTheDocument();
  });

  it('돌아가기를 누르면 주문하지 않아요', async () => {
    const user = userEvent.setup();
    funded();
    renderWithProviders(<App />, { route: '/mock-invest', user: DEV_USER });
    const form = await chooseCompany(user, '삼성전자', '삼성전자');
    await user.click(within(form).getByRole('button', { name: /^(매수|매도) 주문$/ }));
    await user.click(within(form).getByRole('button', { name: '돌아가기' }));
    expect(within(form).queryByRole('group', { name: '주문 확인' })).not.toBeInTheDocument();
    expect(serverMockInvest.trades(DEV_USER.id!)).toHaveLength(0);
    expect(serverMockInvest.cash(DEV_USER.id!)).toBe(500_000);
  });

  it('가상 현금보다 비싸면 주문 확인을 막고, 가진 것보다 많이 팔 수 없어요', async () => {
    const user = userEvent.setup();
    funded();
    renderWithProviders(<App />, { route: '/mock-invest', user: DEV_USER });
    const form = await chooseCompany(user, '삼성바이오로직스', '삼성바이오로직스');
    expect(form).toHaveTextContent('최대 0주');
    expect(within(form).getByRole('alert')).toHaveTextContent(
      '가상 현금이 부족해요. 내 자산에서 앰똥깡을 환전해 주세요',
    );
    expect(within(form).getByRole('button', { name: /^(매수|매도) 주문$/ })).toBeDisabled();

    await user.click(within(form).getByRole('radio', { name: '매도' }));
    expect(within(form).getByRole('alert')).toHaveTextContent(
      '가진 주식이 없어서 매도할 수 없어요',
    );
    expect(within(form).getByRole('button', { name: /^(매수|매도) 주문$/ })).toBeDisabled();
  });

  it('매도: 판 금액만큼 가상 현금이 늘어요', async () => {
    const user = userEvent.setup();
    funded();
    renderWithProviders(<App />, { route: '/mock-invest', user: DEV_USER });
    const form = await chooseCompany(user, '삼성전자', '삼성전자');
    await user.click(within(form).getByRole('button', { name: /^(매수|매도) 주문$/ }));
    await user.click(within(form).getByRole('button', { name: '매수 확정' }));
    await screen.findByText(/체결됐어요/);
    await waitFor(() => expect(serverMockInvest.cash(DEV_USER.id!)).toBe(371_500));

    await user.click(within(form).getByRole('radio', { name: '매도' }));
    expect(form).toHaveTextContent('가진 수량 1주');
    await user.click(within(form).getByRole('button', { name: /^(매수|매도) 주문$/ }));
    await user.click(within(form).getByRole('button', { name: '매도 확정' }));
    await waitFor(() =>
      expect(screen.getByText(/체결됐어요/)).toHaveTextContent('삼성전자 1주 매도'),
    );
    expect(serverMockInvest.cash(DEV_USER.id!)).toBe(500_000);
    expect(serverWallet.get(DEV_USER.id!)?.balance).toBe(0);
    expect(await screen.findByRole('region', { name: '보유 종목 0개' })).toBeInTheDocument();
  });

  it('보유 종목의 [매도]·[매수] 버튼으로 검색 없이 그 종목 주문 칸이 바로 열려요', async () => {
    const user = userEvent.setup();
    funded();
    renderWithProviders(<App />, { route: '/mock-invest', user: DEV_USER });
    const form = await chooseCompany(user, '삼성전자', '삼성전자');
    await user.click(within(form).getByRole('button', { name: /^(매수|매도) 주문$/ }));
    await user.click(within(form).getByRole('button', { name: '매수 확정' }));
    await screen.findByText(/체결됐어요/);

    // 주문 칸을 다른 기업으로 바꿔 둬도, 보유 종목의 [매도]를 누르면 삼성전자 매도로 바뀌어요
    await user.click(within(form).getByRole('button', { name: '기업 바꾸기' }));
    const holdings = await screen.findByRole('region', { name: '보유 종목 1개' });
    await user.click(within(holdings).getByRole('button', { name: '삼성전자 매도' }));

    const sellForm = await screen.findByRole('form', { name: '삼성전자 주문' });
    expect(within(sellForm).getByRole('radio', { name: '매도' })).toBeChecked();
    expect(sellForm).toHaveTextContent('가진 수량 1주');
    await user.click(within(sellForm).getByRole('button', { name: /^(매수|매도) 주문$/ }));
    await user.click(within(sellForm).getByRole('button', { name: '매도 확정' }));
    await waitFor(() =>
      expect(screen.getByText(/체결됐어요/)).toHaveTextContent('삼성전자 1주 매도'),
    );
    expect(serverMockInvest.cash(DEV_USER.id!)).toBe(500_000);
  });

  it('내 자산 비중: 가상 현금과 보유 종목이 총 자산에서 차지하는 비율을 보여줘요', async () => {
    const user = userEvent.setup();
    funded();
    renderWithProviders(<App />, { route: '/mock-invest', user: DEV_USER });
    const alloc = await screen.findByRole('region', { name: '내 자산 비중' });
    // 매수 전: 전부 가상 현금
    expect(within(alloc).getByRole('list')).toHaveTextContent('가상 현금500,000원100%');

    const form = await chooseCompany(user, '삼성전자', '삼성전자');
    await user.click(within(form).getByRole('button', { name: /^(매수|매도) 주문$/ }));
    await user.click(within(form).getByRole('button', { name: '매수 확정' }));
    await screen.findByText(/체결됐어요/);

    // 삼성전자 128,500원 + 현금 371,500원 = 500,000원
    await waitFor(() => expect(alloc).toHaveTextContent('삼성전자128,500원25.7%'));
    expect(alloc).toHaveTextContent('가상 현금371,500원74.3%');
    expect(within(alloc).getByRole('img')).toHaveAccessibleName(/삼성전자 25.7%, 가상 현금 74.3%/);
    expect(within(alloc).getByRole('link', { name: '삼성전자' })).toHaveAttribute(
      'href',
      '/companies/005930',
    );
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
    funded();
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
