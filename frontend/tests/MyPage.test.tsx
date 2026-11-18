import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from '../src/App';
import { DEV_USER, type AuthUser } from '../src/features/auth/AuthContext';
import { nicknameProblem } from '../src/utils/nickname';
import { resetNicknames, takenNicknames } from './fixtures/me';
import { renderWithProviders } from './testUtils';

const ME: AuthUser = { ...DEV_USER, nickname: '다정한고래1', joined_at: '2026-11-01' };
beforeEach(() => resetNicknames());

describe('마이페이지', () => {
  it('로그인하지 않았으면 로그인 안내를 보여줘요', async () => {
    renderWithProviders(<App />, { route: '/mypage' });
    expect(await screen.findByText('로그인이 필요해요')).toBeInTheDocument();
  });

  it('내 이메일·가입일·닉네임을 보여줘요', async () => {
    renderWithProviders(<App />, { route: '/mypage', user: ME });
    expect(await screen.findByRole('heading', { name: '마이페이지' })).toBeInTheDocument();
    expect(screen.getByLabelText(/이 이름으로 보여요/)).toHaveValue('다정한고래1');
    expect(screen.getByText('dev@dajin.local')).toBeInTheDocument();
    expect(screen.getByText('2026.11.01')).toBeInTheDocument();
  });

  it('닉네임을 바꾸면 상단 메뉴 이름도 바뀌어요', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/mypage', user: ME });
    const input = await screen.findByLabelText(/이 이름으로 보여요/);
    expect(screen.getByRole('button', { name: '저장' })).toBeDisabled(); // 안 바꿨으면 저장 불가

    await user.clear(input);
    await user.type(input, '주식왕_1');
    await user.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() =>
      expect(screen.getByRole('link', { name: '마이페이지' })).toHaveTextContent('주식왕_1님'),
    );
  });

  it('규칙에 맞지 않으면 저장할 수 없고 이유를 알려줘요', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/mypage', user: ME });
    const input = await screen.findByLabelText(/이 이름으로 보여요/);
    await user.clear(input);
    await user.type(input, '가');
    expect(screen.getByRole('alert')).toHaveTextContent('2~12자');
    expect(screen.getByRole('button', { name: '저장' })).toBeDisabled();
  });

  it('이미 쓰는 닉네임이면 서버 메시지를 보여줘요', async () => {
    takenNicknames.add('dajin');
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/mypage', user: ME });
    const input = await screen.findByLabelText(/이 이름으로 보여요/);
    await user.clear(input);
    await user.type(input, 'Dajin');
    takenNicknames.add('dajin');
    await user.click(screen.getByRole('button', { name: '저장' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('이미 다른 사람이 쓰고 있는');
  });
});

describe('nicknameProblem', () => {
  it.each([
    ['', null],
    ['주식왕', null],
    ['a_1', null],
    ['가', '닉네임은 2~12자로 정해 주세요.'],
    ['a'.repeat(13), '닉네임은 2~12자로 정해 주세요.'],
    ['공백 있음', '한글, 영문, 숫자, 밑줄(_)만 쓸 수 있어요.'],
  ])('%s → %s', (value, expected) => {
    expect(nicknameProblem(value)).toBe(expected);
  });
});
