import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from '../src/App';
import { DEV_USER, type AuthUser } from '../src/features/auth/AuthContext';
import { deletedAccounts, resetNicknames } from './fixtures/me';
import { renderWithProviders } from './testUtils';

const NEW_USER: AuthUser = { ...DEV_USER, consent_required: true };
beforeEach(() => {
  resetNicknames();
  deletedAccounts.length = 0;
});

describe('약관 동의 화면', () => {
  it('동의가 필요한 사용자에게 보여주고, 모두 체크하기 전에는 시작할 수 없어요', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/', user: NEW_USER });
    const dialog = await screen.findByRole('dialog', { name: '서비스 이용 동의' });
    const start = within(dialog).getByRole('button', { name: '동의하고 시작하기' });
    expect(start).toBeDisabled();

    await user.click(within(dialog).getByLabelText(/만 14세 이상/));
    await user.click(within(dialog).getByLabelText(/이용약관/));
    expect(start).toBeDisabled(); // 하나라도 빠지면 안 돼요
    await user.click(within(dialog).getByLabelText(/개인정보 처리방침/));
    expect(start).toBeEnabled();
  });

  it('전체 동의 후 시작하면 화면이 닫혀요', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/', user: NEW_USER });
    const dialog = await screen.findByRole('dialog', { name: '서비스 이용 동의' });
    await user.click(within(dialog).getByLabelText('전체 동의'));
    await user.click(within(dialog).getByRole('button', { name: '동의하고 시작하기' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: '서비스 이용 동의' })).not.toBeInTheDocument(),
    );
  });

  it('닫기 버튼이 없고, 동의하지 않으면 로그아웃할 수 있어요', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/', user: NEW_USER });
    const dialog = await screen.findByRole('dialog', { name: '서비스 이용 동의' });
    expect(within(dialog).queryByRole('button', { name: '시트 닫기' })).not.toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog', { name: '서비스 이용 동의' })).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: '동의하지 않고 로그아웃' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('동의가 필요 없는 사용자에게는 보이지 않고, 약관 화면에서는 가리지 않아요', async () => {
    const { unmount } = renderWithProviders(<App />, { route: '/', user: DEV_USER });
    await screen.findByRole('link', { name: '다진 홈' });
    expect(screen.queryByRole('dialog', { name: '서비스 이용 동의' })).not.toBeInTheDocument();
    unmount();

    renderWithProviders(<App />, { route: '/legal/terms', user: NEW_USER });
    expect(await screen.findByRole('heading', { name: '이용약관' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: '서비스 이용 동의' })).not.toBeInTheDocument();
  });
});

describe('약관·개인정보 처리방침 화면', () => {
  it('로그인 없이 읽을 수 있고, 푸터에서 갈 수 있어요', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/' });
    await user.click(await screen.findByRole('link', { name: '개인정보 처리방침' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: '개인정보 처리방침' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/탈퇴하면 위 정보를 지체 없이 삭제/)).toBeInTheDocument();
  });

  it('약관에 투자 권유가 아니라는 안내가 있어요', async () => {
    renderWithProviders(<App />, { route: '/legal/terms' });
    expect(await screen.findByText(/투자 권유가 아니에요/)).toBeInTheDocument();
  });
});

describe('회원 탈퇴', () => {
  it('확인 후 탈퇴하면 로그아웃되고 서버 기록이 지워져요', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/mypage', user: DEV_USER });
    await user.click(await screen.findByRole('button', { name: '회원 탈퇴' }));
    const dialog = await screen.findByRole('dialog', { name: '정말 탈퇴할까요?' });
    expect(deletedAccounts).toEqual([]); // 확인 전에는 지우지 않아요
    await user.click(within(dialog).getByRole('button', { name: '네, 탈퇴할게요' }));

    await waitFor(() => expect(deletedAccounts).toEqual([DEV_USER.id]));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(await screen.findByRole('button', { name: /Google로 로그인/ })).toBeInTheDocument();
  });

  it('취소하면 아무것도 지우지 않아요', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/mypage', user: DEV_USER });
    await user.click(await screen.findByRole('button', { name: '회원 탈퇴' }));
    const dialog = await screen.findByRole('dialog', { name: '정말 탈퇴할까요?' });
    await user.click(within(dialog).getByRole('button', { name: '취소' }));
    expect(deletedAccounts).toEqual([]);
    expect(screen.getByRole('heading', { name: '마이페이지' })).toBeInTheDocument();
  });
});
