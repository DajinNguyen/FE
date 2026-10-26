import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { CommunityTab } from '../src/features/community/CommunityTab';
import { renderWithProviders } from './testUtils';

describe('커뮤니티 탭', () => {
  it('맨 위에 금지 안내를 보여주고, 글을 10개씩 보여주다가 [더 보기]로 이어 붙여요', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommunityTab stockCode="005930" />);

    expect(
      screen.getByText('종목 추천, 매수·매도 권유, 유료 리딩방 홍보는 금지돼요'),
    ).toBeInTheDocument();
    const list = await screen.findByRole('list', { name: '글 목록' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(10);
    // 첫 글: 말머리·제목·닉네임·댓글·좋아요
    const first = within(list).getAllByRole('link')[0];
    expect(first).toHaveTextContent('질문');
    expect(first).toHaveTextContent('HBM이 뭔지 쉽게 알려주실 분?');
    expect(first).toHaveTextContent(/주린이 · .+ · 댓글 3 · 좋아요 12/);
    // 신고로 숨겨진 글
    expect(within(list).getByText('신고로 숨겨진 글이에요')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '더 보기' }));
    await waitFor(() =>
      expect(
        within(screen.getByRole('list', { name: '글 목록' })).getAllByRole('listitem'),
      ).toHaveLength(12),
    );
  });

  it('말머리로 거르고, 인기순으로 바꿀 수 있어요', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommunityTab stockCode="005930" />);
    await screen.findByRole('list', { name: '글 목록' });

    await user.click(screen.getByRole('button', { name: '분석 공유' }));
    await waitFor(() => {
      const links = within(screen.getByRole('list', { name: '글 목록' })).getAllByRole('link');
      expect(links.every((l) => l.textContent?.startsWith('분석 공유'))).toBe(true);
    });

    await user.click(screen.getByRole('radio', { name: '인기순' }));
    await waitFor(() =>
      expect(
        within(screen.getByRole('list', { name: '글 목록' })).getAllByRole('link')[0],
      ).toHaveTextContent('4분기 실적 정리해 봤어요'),
    );
  });

  it('글이 없는 기업은 "첫 글을 남겨 보세요", 비로그인으로 글쓰기를 누르면 로그인 시트를 띄워요', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommunityTab stockCode="000660" />);

    expect(await screen.findByText('첫 글을 남겨 보세요')).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: '글쓰기' })[0]);
    expect(
      screen.getByRole('dialog', { name: 'Google로 로그인하면 이용할 수 있어요' }),
    ).toBeInTheDocument();
  });
});
