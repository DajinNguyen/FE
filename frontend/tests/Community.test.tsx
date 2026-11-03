import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from '../src/App';
import { checkImage, IMAGE_UPLOAD } from '../src/config/communityRules';
import { CommunityTab } from '../src/features/community/CommunityTab';
import { renderWithProviders } from './testUtils';

type User = ReturnType<typeof userEvent.setup>;
const login = async (user: User) =>
  user.click(await screen.findByRole('button', { name: '개발용으로 로그인' }));

const commentList = () => screen.findByRole('list', { name: '기업 댓글' });
/** 본문으로 기업 댓글 한 개(li)를 찾아요 */
const commentItem = async (text: string) =>
  (await within(await commentList()).findByText(text, { exact: false })).closest('li')!;

afterEach(() => {
  IMAGE_UPLOAD.enabled = true;
});

describe('기업 커뮤니티: 바로 쓰는 댓글', () => {
  it('글쓰기 화면 없이 맨 위 입력창에서 바로 쓰고, 목록은 10개씩 보다가 [더 보기]로 이어 붙여요', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommunityTab stockCode="005930" />);

    expect(
      screen.getByText('종목 추천, 매수·매도 권유, 유료 리딩방 홍보는 금지돼요'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('댓글 입력')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '글쓰기' })).not.toBeInTheDocument();

    const list = await commentList();
    expect(within(list).getAllByRole('listitem', { name: '' }).length).toBeGreaterThan(0);
    const first = await commentItem('메모리를 여러 층 쌓은 거라고 들었는데');
    expect(first).toHaveTextContent(/주린이 · .+/);
    expect(first).not.toHaveTextContent('HBM이 뭔지 쉽게 알려주실 분?');
    expect(within(list).getByText('신고로 숨겨진 댓글이에요')).toBeInTheDocument();
    expect(list.querySelectorAll(':scope > li')).toHaveLength(10);

    await user.click(screen.getByRole('button', { name: '더 보기' }));
    await waitFor(() => expect(list.querySelectorAll(':scope > li')).toHaveLength(12));
  });

  it('인기순으로 바꿀 수 있어요', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommunityTab stockCode="005930" />);
    await commentList();
    await user.click(screen.getByRole('radio', { name: '인기순' }));
    await waitFor(async () => {
      const first = (await commentList()).querySelector(':scope > li');
      expect(first).toHaveTextContent('매출 93.8조, 영업이익 20.1조였어요');
    });
  });

  it('비로그인으로 등록하면 로그인 시트가 뜨고, 로그인하면 바로 올라가요. 내 댓글은 지울 수 있어요', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommunityTab stockCode="000660" />);
    expect(
      await screen.findByText('아직 댓글이 없어요. 첫 댓글을 남겨 보세요.'),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText('댓글 입력'), 'HBM 공부 중이에요');
    await user.click(screen.getByRole('button', { name: '등록' }));
    expect(
      screen.getByRole('dialog', { name: 'Google로 로그인하면 이용할 수 있어요' }),
    ).toBeInTheDocument();
    await login(user);

    const mine = await commentItem('HBM 공부 중이에요');
    await user.click(within(mine).getByRole('button', { name: '삭제' }));
    await waitFor(() => expect(screen.queryByText('HBM 공부 중이에요')).not.toBeInTheDocument());
  });

  it('좋아요: 비로그인으로 누르면 로그인 후 바로 반영돼요', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommunityTab stockCode="005930" />);
    const first = await commentItem('메모리를 여러 층 쌓은 거라고 들었는데');
    await user.click(within(first).getByRole('button', { name: '좋아요 12' }));
    await login(user);
    expect(await within(first).findByRole('button', { name: '좋아요 13' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});

describe('댓글의 답글', () => {
  it('답글은 접혀 있다가 "답글 N개 보기"로 펼치고, 답글의 답글은 "@닉네임"으로 보여요', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommunityTab stockCode="005930" />);
    const first = await commentItem('메모리를 여러 층 쌓은 거라고 들었는데');

    const toggle = within(first).getByRole('button', { name: '답글 5개 보기' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    const replies = await within(first).findByRole('list', { name: '답글' });
    await waitFor(() => expect(within(replies).getAllByRole('listitem')).toHaveLength(5));
    expect(within(replies).getByText('@주린이', { exact: false })).toBeInTheDocument();
    expect(within(replies).getByText('신고로 숨겨진 댓글이에요')).toBeInTheDocument();

    await user.click(within(first).getByRole('button', { name: '답글 숨기기' }));
    expect(within(first).queryByRole('list', { name: '답글' })).not.toBeInTheDocument();
  });

  it('[답글]로 댓글에 답하고, 답글의 [답글]은 "@닉네임"을 붙여 같은 단계에 달아요 (로그인 필요)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommunityTab stockCode="005930" />);
    const first = await commentItem('메모리를 여러 층 쌓은 거라고 들었는데');

    await user.click(within(first).getAllByRole('button', { name: '답글' })[0]);
    await login(user);
    await user.type(await within(first).findByLabelText('답글 입력'), '저도 궁금했어요');
    await user.click(within(first).getAllByRole('button', { name: '등록' })[0]);
    const replies = await within(first).findByRole('list', { name: '답글' });
    expect(await within(replies).findByText('저도 궁금했어요')).toBeInTheDocument();

    const target = within(replies).getByText('여러 층으로 쌓아서', { exact: false }).closest('li')!;
    await user.click(within(target).getByRole('button', { name: '답글' }));
    const input = await within(first).findByLabelText('답글 입력');
    expect(input).toHaveAttribute('placeholder', '@반도체공부중 님에게 답글');
    await user.type(input, '고마워요');
    await user.click(within(input.closest('form')!).getByRole('button', { name: '등록' }));
    const added = (await within(replies).findByText('고마워요', { exact: false })).closest('p')!;
    expect(added).toHaveTextContent('@반도체공부중 고마워요');
  });
});

describe('이모지·사진·신고', () => {
  it('이모지: 비로그인이면 로그인 시트, 로그인하면 패널이 열리고 이모지가 없으면 준비 중 안내', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommunityTab stockCode="005930" />);
    await user.click(screen.getByRole('button', { name: '이모지' }));
    await login(user);
    expect(await screen.findByRole('group', { name: '다진 이모지' })).toHaveTextContent(
      '다진 이모지를 준비하고 있어요',
    );
  });

  it('사진: 기본으로 켜져 있고 jpg·png·webp 5MB 이하만 받아요 (업로드 서버를 끄면 "준비 중")', async () => {
    expect(checkImage({ type: 'image/png', size: 1024 })).toBeNull();
    expect(checkImage({ type: 'image/gif', size: 1024 })).toBe(
      'jpg·png·webp 사진만 올릴 수 있어요.',
    );
    expect(checkImage({ type: 'image/jpeg', size: 6 * 1024 * 1024 })).toBe(
      '5MB 이하 사진만 올릴 수 있어요.',
    );

    // 업로드 서버를 꺼 두면 "준비 중"
    IMAGE_UPLOAD.enabled = false;
    const { unmount } = renderWithProviders(<CommunityTab stockCode="005930" />);
    expect(screen.getByRole('button', { name: '사진 (준비 중)' })).toBeDisabled();
    unmount();

    IMAGE_UPLOAD.enabled = true;
    const user = userEvent.setup({ applyAccept: false });
    renderWithProviders(<CommunityTab stockCode="005930" />);
    await user.click(screen.getByRole('button', { name: '사진' }));
    await login(user);
    await user.upload(
      screen.getByLabelText('사진 고르기'),
      new File(['gif'], 'a.gif', { type: 'image/gif' }),
    );
    expect(screen.getByRole('alert')).toHaveTextContent('jpg·png·webp 사진만 올릴 수 있어요.');
  });

  it('신고: 사유에 "부적절한 사진"이 있고, 신고하면 다시 신고할 수 없어요', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommunityTab stockCode="005930" />);
    const item = await commentItem('매출 93.8조, 영업이익 20.1조였어요');
    await user.click(within(item).getByRole('button', { name: '신고' }));
    await login(user);

    const sheet = await screen.findByRole('dialog', { name: '댓글 신고' });
    expect(within(sheet).getByRole('radio', { name: '부적절한 사진' })).toBeInTheDocument();
    await user.click(within(sheet).getByRole('radio', { name: '투자 권유·리딩방' }));
    await user.click(within(sheet).getByRole('button', { name: '신고하기' }));
    expect(await screen.findByText('신고했어요. 확인 후 처리할게요.')).toBeInTheDocument();
    expect(await within(item).findByRole('button', { name: '신고함' })).toBeDisabled();
  });

  it('기업 댓글은 2,000자, 답글은 500자까지 쓸 수 있어요', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommunityTab stockCode="005930" />);
    expect(screen.getByLabelText('댓글 입력')).toHaveAttribute('maxlength', '2000');
    expect(screen.getByText('0/2,000')).toBeInTheDocument();

    const first = await commentItem('메모리를 여러 층 쌓은 거라고 들었는데');
    await user.click(within(first).getAllByRole('button', { name: '답글' })[0]);
    await login(user);
    expect(await within(first).findByLabelText('답글 입력')).toHaveAttribute('maxlength', '500');
  });

  it('기업 댓글에 붙인 사진도 작게 보이고, 누르면 크게 볼 수 있어요', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommunityTab stockCode="000660" />);
    await screen.findByText('아직 댓글이 없어요. 첫 댓글을 남겨 보세요.');
    // 사진 올리기(XHR)는 브라우저에서만 돼서, 서버가 사진 주소를 돌려준 것처럼 바로 써요.
    await login(user).catch(() => {});
    const { createPost } = await import('../src/api/community');
    await createPost('000660', {
      category: 'free',
      body: '공장 사진이에요',
      image_url: '/photo.png',
    });
    await user.click(screen.getByRole('radio', { name: '인기순' }));

    const item = await commentItem('공장 사진이에요');
    await user.click(within(item).getByRole('button', { name: '사진 크게 보기' }));
    expect(
      within(screen.getByRole('dialog', { name: '댓글 사진' })).getByRole('img', {
        name: '댓글 사진 크게 보기',
      }),
    ).toHaveAttribute('src', '/photo.png');
  });

  it('예전 글쓰기·글 보기 주소는 기업 화면 커뮤니티 탭으로 보내요', async () => {
    renderWithProviders(
      <Routes>
        <Route path="*" element={<App />} />
      </Routes>,
      { route: '/companies/005930/community/write' },
    );
    expect(
      await screen.findByRole('tab', { name: '커뮤니티', selected: true }),
    ).toBeInTheDocument();
  });
});
