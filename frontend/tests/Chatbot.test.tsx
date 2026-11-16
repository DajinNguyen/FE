import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from '../src/App';
import { DEV_USER } from '../src/features/auth/AuthContext';
import { lastChatRequest } from './fixtures/chat';
import { failRequests } from './fixtures/fetchStub';
import { serverWallet } from './fixtures/wallet';
import { renderWithProviders } from './testUtils';

type User = ReturnType<typeof userEvent.setup>;
const chatDialog = () => screen.getByRole('dialog', { name: 'AI에게 물어보기' });

async function openChat(user: User) {
  await user.click(screen.getByRole('button', { name: 'AI에게 물어보기' }));
  return chatDialog();
}

describe('AI 챗봇', () => {
  it('비로그인은 버튼을 누르면 대화창 대신 로그인 시트가 떠요', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/' });
    await user.click(await screen.findByRole('button', { name: 'AI에게 물어보기' }));
    expect(
      screen.getByRole('dialog', { name: 'Google로 로그인하면 가입 선물로 50 ADK를 드려요' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'AI에게 물어보기' })).not.toBeInTheDocument();
  });

  it('지금 보는 화면과 추천 질문을 보여주고, 질문에 화면 정보를 함께 보내요. 답변을 받으면 5 ADK', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/companies/005930?tab=financials', user: DEV_USER });
    await screen.findByRole('button', { name: '내 앰똥깡 50 ADK' });
    const dialog = await openChat(user);
    expect(dialog).toHaveTextContent('지금 보고 있는 화면: 삼성전자 · 재무 상세');
    const suggestions = within(dialog).getByRole('list', { name: '추천 질문' });
    expect(within(suggestions).getAllByRole('button')).toHaveLength(3);
    expect(within(dialog).getByRole('button', { name: '보내기 · 5 ADK' })).toBeDisabled();

    await user.click(within(suggestions).getByRole('button', { name: '영업이익률이 뭐예요?' }));
    const log = within(dialog).getByRole('log', { name: '대화' });
    expect(within(log).getByText('영업이익률이 뭐예요?')).toBeInTheDocument();
    expect(await within(log).findByText(/삼성전자 화면을 기준으로/)).toBeInTheDocument();
    expect(within(log).getByText('투자 추천이 아닌 교육용 설명이에요')).toBeInTheDocument();
    // 답변 속 용어는 용어 시트로 열 수 있어요
    expect(within(log).getByRole('button', { name: '영업이익률' })).toHaveAttribute(
      'aria-haspopup',
      'dialog',
    );

    expect(lastChatRequest).toMatchObject({
      message: '영업이익률이 뭐예요?',
      context: { page: 'company', tab: 'financials', stock_code: '005930' },
      conversation_id: null,
    });
    expect(serverWallet.get(DEV_USER.id!)?.balance).toBe(45);
    expect(await screen.findByRole('button', { name: '내 앰똥깡 45 ADK' })).toBeInTheDocument();
  });

  it('답변을 받지 못하면 ADK 를 빼지 않았다고 알려요', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/', user: DEV_USER });
    await screen.findByRole('button', { name: '내 앰똥깡 50 ADK' });
    const dialog = await openChat(user);
    failRequests((path) => path === '/api/chat');
    await user.type(within(dialog).getByLabelText('질문 입력'), '코스피가 뭐예요?');
    await user.click(within(dialog).getByRole('button', { name: '보내기 · 5 ADK' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      '답변을 받지 못해 ADK는 차감되지 않았어요',
    );
    expect(serverWallet.get(DEV_USER.id!)?.balance).toBe(50);
  });

  it('잔액이 5 ADK 보다 적으면 보내기를 잠그고 낱말퀴즈로 안내해요', async () => {
    serverWallet.setBalance(DEV_USER.id!, 4);
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/', user: DEV_USER });
    await screen.findByRole('button', { name: /내 앰똥깡 4 ADK/ });
    const dialog = await openChat(user);
    await user.type(within(dialog).getByLabelText('질문 입력'), '질문');
    expect(within(dialog).getByRole('button', { name: '보내기 · 5 ADK' })).toBeDisabled();
    expect(within(dialog).getByRole('note')).toHaveTextContent(
      '앰똥깡이 부족해요. 낱말퀴즈 3개를 풀면 20 ADK를 받을 수 있어요',
    );
    expect(within(dialog).getByRole('link', { name: '낱말퀴즈 풀러 가기' })).toBeInTheDocument();
  });

  it('페이지를 옮겨도 대화가 남고, 이어서 물으면 같은 대화로 보내요. [새 대화]로 비워요', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/', user: DEV_USER });
    await screen.findByRole('button', { name: '내 앰똥깡 50 ADK' });
    let dialog = await openChat(user);
    await user.type(within(dialog).getByLabelText('질문 입력'), '첫 질문');
    await user.click(within(dialog).getByRole('button', { name: '보내기 · 5 ADK' }));
    await within(dialog).findByText(/지금 화면을 기준으로/);
    await user.click(within(dialog).getByRole('button', { name: '시트 닫기' }));

    await user.click(screen.getByRole('link', { name: '용어 카드' }));
    dialog = await openChat(user);
    expect(dialog).toHaveTextContent('지금 보고 있는 화면: 용어 학습');
    expect(within(dialog).getByText('첫 질문')).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText('질문 입력'), '두 번째 질문');
    await user.click(within(dialog).getByRole('button', { name: '보내기 · 5 ADK' }));
    await waitFor(() => expect(lastChatRequest?.message).toBe('두 번째 질문'));
    expect(lastChatRequest).toMatchObject({ conversation_id: 'c1', context: { page: 'learn' } });
    await within(dialog).findAllByText('투자 추천이 아닌 교육용 설명이에요');

    await user.click(within(dialog).getByRole('button', { name: '새 대화' }));
    expect(within(dialog).queryByText('첫 질문')).not.toBeInTheDocument();
    expect(within(dialog).getByRole('list', { name: '추천 질문' })).toBeInTheDocument();
  });
});
