import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { CommunityTab } from '../src/features/community/CommunityTab';
import { CommunityPostPage } from '../src/pages/CommunityPostPage';
import { CommunityWritePage } from '../src/pages/CommunityWritePage';
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

const renderPost = (postId: string) =>
  renderWithProviders(
    <Routes>
      <Route path="/companies/:stockCode/community/:postId" element={<CommunityPostPage />} />
      <Route path="/companies/:stockCode" element={<p>기업 화면</p>} />
    </Routes>,
    { route: `/companies/005930/community/${postId}` },
  );

describe('글 보기', () => {
  it('좋아요: 비로그인으로 누르면 로그인 후 바로 반영되고, 다시 누르면 취소돼요', async () => {
    const user = userEvent.setup();
    renderPost('p1');

    const like = await screen.findByRole('button', { name: /좋아요 12/ });
    expect(like).toHaveAttribute('aria-pressed', 'false');
    await user.click(like);
    await user.click(screen.getByRole('button', { name: '개발용으로 로그인' }));

    expect(await screen.findByRole('button', { name: /좋아요 13/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await user.click(screen.getByRole('button', { name: /좋아요 13/ }));
    expect(await screen.findByRole('button', { name: /좋아요 12/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('댓글을 쓰면 바로 보이고, 내 댓글은 지울 수 있어요. 숨겨진 댓글은 내용을 가려요', async () => {
    const user = userEvent.setup();
    renderPost('p1');

    expect(await screen.findByText('신고로 숨겨진 댓글이에요')).toBeInTheDocument();
    await user.type(screen.getByLabelText('댓글 입력'), '저도 궁금했어요');
    await user.click(screen.getByRole('button', { name: '등록' }));
    await user.click(screen.getByRole('button', { name: '개발용으로 로그인' }));

    expect(await screen.findByText('저도 궁금했어요')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: '댓글 4' })).toBeInTheDocument();
    const comments = screen.getByRole('list', { name: '댓글' });

    await waitFor(() =>
      expect(within(comments).getByRole('button', { name: '삭제' })).toBeEnabled(),
    );
    await user.click(within(comments).getByRole('button', { name: '삭제' }));
    await waitFor(() =>
      expect(within(comments).queryByText('저도 궁금했어요')).not.toBeInTheDocument(),
    );
  });

  it('신고로 숨겨진 글은 내용을 보여주지 않아요', async () => {
    renderPost('p12');
    expect(await screen.findByText('신고로 숨겨진 글이에요')).toBeInTheDocument();
    expect(screen.queryByText('오늘 꼭 사세요 무조건 오릅니다')).not.toBeInTheDocument();
  });
});

const renderWrite = () =>
  renderWithProviders(
    <Routes>
      <Route path="/companies/:stockCode/community/write" element={<CommunityWritePage />} />
      <Route path="/companies/:stockCode/community/:postId" element={<CommunityPostPage />} />
      <Route path="/companies/:stockCode" element={<p>기업 화면</p>} />
    </Routes>,
    { route: '/companies/005930/community/write' },
  );

async function loginOnWritePage(user: ReturnType<typeof userEvent.setup>) {
  // 처음에는 로그인 여부를 확인하는 동안 잠깐 비어 있어요.
  await user.click(await screen.findByRole('button', { name: '로그인하기' }));
  await user.click(screen.getByRole('button', { name: '개발용으로 로그인' }));
}

describe('글쓰기', () => {
  it('로그인해야 쓸 수 있고, 제목은 50자까지만 들어가요', async () => {
    const user = userEvent.setup();
    renderWrite();
    expect(await screen.findByText('로그인하면 글을 쓸 수 있어요')).toBeInTheDocument();
    await loginOnWritePage(user);

    const title = screen.getByLabelText('제목');
    await user.type(title, '가'.repeat(60));
    expect(title).toHaveValue('가'.repeat(50));
    expect(screen.getByText('50/50')).toBeInTheDocument();
  });

  it('금지어가 있으면 등록하지 않고 안내해요. 고치면 등록되고 글 보기로 이동해요', async () => {
    const user = userEvent.setup();
    renderWrite();
    await loginOnWritePage(user);

    await user.type(screen.getByLabelText('제목'), '같이 공부해요');
    await user.type(screen.getByLabelText('본문'), '리딩방 들어오시면 알려드려요');
    await user.click(screen.getByRole('button', { name: '등록' }));
    expect(screen.getByRole('alert')).toHaveTextContent('쓸 수 없는 표현이 있어요');

    await user.clear(screen.getByLabelText('본문'));
    await user.type(screen.getByLabelText('본문'), '재무제표 같이 공부해요');
    await user.click(screen.getByRole('button', { name: '등록' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: '같이 공부해요' }),
    ).toBeInTheDocument();
  });

  it('쓰던 중 [취소]를 누르면 화면 안에서 한 번 더 물어봐요', async () => {
    const user = userEvent.setup();
    renderWrite();
    await loginOnWritePage(user);

    await user.type(screen.getByLabelText('제목'), '쓰는 중');
    await user.click(screen.getByRole('button', { name: '취소' }));
    expect(screen.getByRole('dialog', { name: '작성 중인 글이 사라져요' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '계속 쓰기' }));
    expect(screen.getByLabelText('제목')).toHaveValue('쓰는 중');
  });
});

describe('신고', () => {
  it('사유를 골라 신고하면 완료 토스트가 뜨고, 같은 글은 다시 신고할 수 없어요', async () => {
    const user = userEvent.setup();
    renderPost('p2');

    await user.click(await screen.findByRole('button', { name: '신고' }));
    await user.click(screen.getByRole('button', { name: '개발용으로 로그인' }));

    const sheet = await screen.findByRole('dialog', { name: '글 신고' });
    expect(within(sheet).getByRole('button', { name: '신고하기' })).toBeDisabled();
    await user.click(within(sheet).getByRole('radio', { name: '투자 권유·리딩방' }));
    await user.click(within(sheet).getByRole('button', { name: '신고하기' }));

    expect(await screen.findByText('신고했어요. 확인 후 처리할게요.')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: '신고함' })).toBeDisabled();
  });
});
