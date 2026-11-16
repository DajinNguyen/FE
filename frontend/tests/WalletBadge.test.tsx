import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from '../src/App';
import { DEV_USER } from '../src/features/auth/AuthContext';
import { serverWallet } from './fixtures/wallet';
import { renderWithProviders } from './testUtils';

const header = () => screen.getByRole('banner');

describe('헤더 앰똥깡 배지', () => {
  it('비로그인은 배지 없이 로그인 버튼만 보여요', async () => {
    renderWithProviders(<App />);
    expect(
      await within(header()).findByRole('button', { name: /Google로 로그인/ }),
    ).toBeInTheDocument();
    expect(within(header()).queryByRole('button', { name: /내 앰똥깡/ })).not.toBeInTheDocument();
  });

  it('로그인하면 계정 이름 옆에 잔액을 천 단위 쉼표로 보여줘요', async () => {
    serverWallet.setBalance(DEV_USER.id!, 1240);
    renderWithProviders(<App />, { user: DEV_USER });
    const badge = await within(header()).findByRole('button', { name: '내 앰똥깡 1,240 ADK' });
    expect(badge).toHaveTextContent('1,240 ADK');
  });

  it('잔액이 리포트 비용(7 ADK)보다 적으면 경고 표시를 해요', async () => {
    serverWallet.setBalance(DEV_USER.id!, 6);
    renderWithProviders(<App />, { user: DEV_USER });
    expect(
      await within(header()).findByRole('button', { name: '내 앰똥깡 6 ADK (부족해요)' }),
    ).toBeInTheDocument();
  });

  it('배지를 누르면 잔액·진행·쓰는 곳·최근 내역·안내가 있는 시트가 열리고, 낱말퀴즈로 갈 수 있어요', async () => {
    serverWallet.setProgress(DEV_USER.id!, 2, 1);
    const user = userEvent.setup();
    renderWithProviders(<App />, { user: DEV_USER });
    await user.click(await within(header()).findByRole('button', { name: '내 앰똥깡 50 ADK' }));

    const sheet = screen.getByRole('dialog', { name: '내 앰똥깡' });
    expect(within(sheet).getByText('50 ADK')).toBeInTheDocument();
    expect(sheet).toHaveTextContent('다음 보상까지 낱말퀴즈2/3');
    expect(sheet).toHaveTextContent('오늘 보상1/2');
    expect(sheet).toHaveTextContent('AI 리포트 만들기 7 ADK');
    expect(sheet).toHaveTextContent('AI 챗봇 질문 5 ADK');
    const history = within(sheet).getByRole('region', { name: '최근 내역' });
    expect(within(history).getAllByRole('listitem')[0]).toHaveTextContent('+50 ADK가입 선물오늘');
    expect(sheet).toHaveTextContent('실제 돈이 아니며 구매·환전할 수 없어요');

    await user.click(within(sheet).getByRole('button', { name: '낱말퀴즈 풀러 가기' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: '내 앰똥깡' })).not.toBeInTheDocument(),
    );
    expect(await screen.findByRole('heading', { name: '용어 카드' })).toBeInTheDocument();
  });
});
