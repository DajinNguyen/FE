import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { useRequireLogin } from '../src/hooks/useRequireLogin';
import { renderWithProviders } from './testUtils';

function LikeButton({ onLike }: { onLike: () => void }) {
  const requireLogin = useRequireLogin();
  return (
    <button type="button" onClick={() => requireLogin(onLike)}>
      좋아요
    </button>
  );
}

describe('로그인이 필요한 동작', () => {
  it('비로그인으로 누르면 로그인 안내 시트를 띄우고, 개발용 로그인을 하면 눌렀던 동작을 이어서 해요', async () => {
    const user = userEvent.setup();
    const onLike = vi.fn();
    renderWithProviders(<LikeButton onLike={onLike} />);

    await user.click(screen.getByRole('button', { name: '좋아요' }));
    const sheet = screen.getByRole('dialog', { name: 'Google로 로그인하면 이용할 수 있어요' });
    expect(sheet).toBeInTheDocument();
    expect(onLike).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: '개발용으로 로그인' }));
    expect(onLike).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // 이제는 시트 없이 바로 실행돼요.
    await user.click(screen.getByRole('button', { name: '좋아요' }));
    expect(onLike).toHaveBeenCalledTimes(2);
  });

  it('[닫기]를 누르면 동작은 실행하지 않아요', async () => {
    const user = userEvent.setup();
    const onLike = vi.fn();
    renderWithProviders(<LikeButton onLike={onLike} />);
    await user.click(screen.getByRole('button', { name: '좋아요' }));
    await user.click(screen.getByRole('button', { name: '닫기' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onLike).not.toHaveBeenCalled();
  });
});
