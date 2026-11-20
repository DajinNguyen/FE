import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { DEV_USER } from '../src/features/auth/AuthContext';
import { TermCardsPage } from '../src/pages/TermCardsPage';
import { failRequests } from './fixtures/fetchStub';
import { crosswordAnswers } from './fixtures/mockServer';
import { renderWithProviders } from './testUtils';

const renderPuzzle = (user = DEV_USER as typeof DEV_USER | null) =>
  renderWithProviders(
    <Routes>
      <Route path="/terms" element={<TermCardsPage />} />
    </Routes>,
    { route: '/terms?mode=crossword&puzzle=basics-easy', user },
  );

const typeIn = async (user: ReturnType<typeof userEvent.setup>, text: string) => {
  screen.getByRole('textbox', { name: /답 입력/ }).focus();
  await user.keyboard(text);
};

/** 지금까지 서버로 간 요청 (경로와 보낸 내용) */
const calls = (part: string) =>
  vi
    .mocked(fetch)
    .mock.calls.filter(([url]) => String(url).includes(part))
    .map(([, init]) => (init?.body ? JSON.parse(String(init.body)) : null));

async function solveAll(user: ReturnType<typeof userEvent.setup>) {
  const clues = await screen.findByRole('complementary', { name: '열쇠 목록' });
  const across = within(clues).getByRole('region', { name: '가로 열쇠' });
  const down = within(clues).getByRole('region', { name: '세로 열쇠' });
  const answers: [HTMLElement, string, string][] = [
    [across, '3', '주가지수'],
    [across, '5', '주주'],
    [across, '7', '회계연도'],
    [down, '1', '주가'],
    [down, '2', '매수'],
    [down, '3', '주주총회'],
    [down, '4', '지분'],
    [down, '6', '매도'],
  ];
  for (const [list, number, answer] of answers) {
    await user.click(within(list).getByRole('button', { name: new RegExp(`^${number}`) }));
    await typeIn(user, `${answer}{Enter}`);
  }
  await screen.findByText('다 풀었어요!');
}

describe('낱말퀴즈: 정답은 서버만 알아요', () => {
  it('퍼즐 응답에는 정답이 없고, 단어를 채우면 채운 칸을 서버에 보내 채점을 받아요', async () => {
    const user = userEvent.setup();
    renderPuzzle();
    await screen.findByRole('textbox', { name: /가로 3번/ });

    await typeIn(user, '주가지수{Enter}');
    await waitFor(() => expect(calls('/check').length).toBeGreaterThan(0));
    const body = calls('/check').at(-1);
    expect(body.entries).toMatchObject({ '1,1': '주', '1,2': '가', '1,3': '지', '1,4': '수' });
    // 화면이 받은 퍼즐(응답)에 정답이 들어 있지 않아요 — 서버만 정답을 알아요.
    const response =
      await vi.mocked(fetch).mock.results[
        vi
          .mocked(fetch)
          .mock.calls.findIndex(([url]) =>
            String(url).endsWith('/api/learn/crosswords/basics-easy'),
          )
      ].value;
    expect(JSON.stringify(await response.json())).not.toContain('"answer"');
  });

  it('비로그인도 서버에 채점을 부탁해서 맞고 틀림을 볼 수 있어요', async () => {
    const user = userEvent.setup();
    renderPuzzle(null);
    await screen.findByRole('textbox', { name: /가로 3번/ });
    await typeIn(user, '주가지수{Enter}');
    expect(
      await screen.findByRole('button', {
        name: /^가로 3번, 1번째 칸, 세로 3번, 1번째 칸, 입력: 주, 맞음$/,
      }),
    ).toHaveAttribute('data-mark', 'correct');
  });

  it('[확인]은 서버가 틀리다고 한 칸만 빨갛게 표시해요', async () => {
    const user = userEvent.setup();
    renderPuzzle();
    await screen.findByRole('textbox', { name: /가로 3번/ });
    await typeIn(user, '주가지소{Enter}'); // 마지막 글자가 틀려요
    await user.click(screen.getByRole('button', { name: '확인' }));

    expect(await screen.findByText('틀린 칸 1개를 빨간색으로 표시했어요')).toBeInTheDocument();
  });

  it('[힌트]는 서버가 초성 → 첫 글자 순서로 줘요', async () => {
    const user = userEvent.setup();
    renderPuzzle();
    await screen.findByRole('textbox', { name: /가로 3번/ });

    await user.click(screen.getByRole('button', { name: '힌트' }));
    expect(await screen.findByText('ㅈㄱㅈㅅ')).toBeInTheDocument(); // 주가지수
    await user.click(screen.getByRole('button', { name: '한 글자 공개' }));
    expect(
      await screen.findByRole('button', {
        name: /^가로 3번, 1번째 칸, 세로 3번, 1번째 칸, 입력: 주/,
      }),
    ).toBeInTheDocument();
    expect(calls('/hint')).toEqual([
      { word_index: expect.any(Number), level: 1 },
      { word_index: expect.any(Number), level: 2 },
    ]);
    expect(screen.getByText('힌트 다 씀', { selector: 'button' })).toBeDisabled();
  });

  it('끝까지 풀면 마지막으로 채운 칸을 완료 요청에 같이 보내요 (서버가 정답과 비교해요)', async () => {
    const user = userEvent.setup();
    renderPuzzle();
    await solveAll(user);

    await waitFor(() => expect(calls('puzzle-completions')).toHaveLength(1));
    const body = calls('puzzle-completions')[0];
    expect(body).toMatchObject({ puzzle_id: 'basics-easy', used_reveal: false });
    expect(body.entries).toEqual(crosswordAnswers('basics-easy'));
  });

  it('[정답 보기]는 서버가 준 정답으로 칸을 채우고, 완료 요청은 정답 보기를 썼다고 알려요', async () => {
    const user = userEvent.setup();
    renderPuzzle();
    await screen.findByRole('textbox', { name: /가로 3번/ });
    await user.click(screen.getByRole('button', { name: '정답 보기' }));

    expect(await screen.findByText('정답을 채웠어요')).toBeInTheDocument();
    expect(calls('/reveal')).toHaveLength(1);
    await waitFor(() => expect(calls('puzzle-completions')).toHaveLength(1));
    expect(calls('puzzle-completions')[0]).toMatchObject({ used_reveal: true });
  });

  it('서버에 채점을 부탁하지 못하면 안내하고, 색은 칠하지 않아요', async () => {
    failRequests((path) => path.endsWith('/check'));
    const user = userEvent.setup();
    renderPuzzle();
    await screen.findByRole('textbox', { name: /가로 3번/ });
    await typeIn(user, '주가지수{Enter}');

    expect(await screen.findByText(/서버에서 확인하지 못했어요/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^가로 3번, 1번째 칸, 세로 3번, 1번째 칸, 입력: 주/ }),
    ).not.toHaveAttribute('data-mark');
    failRequests(null);
  });

  it('이미 푼 판을 다시 열면 다 푼 판으로 보여주고, 완료를 또 보내지 않아요', async () => {
    const user = userEvent.setup();
    const first = renderPuzzle();
    await solveAll(user);
    await waitFor(() => expect(calls('puzzle-completions')).toHaveLength(1));
    first.unmount();

    renderPuzzle();
    expect(await screen.findByText('다 풀었어요!')).toBeInTheDocument();
    expect(calls('puzzle-completions')).toHaveLength(1);
  });
});
