import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { DEV_USER, type AuthUser } from '../src/features/auth/AuthContext';
import { puzzleRewardText } from '../src/features/crossword/puzzleRewardText';
import { TermGameBanner } from '../src/features/home/TermGameBanner';
import { TermCardsPage } from '../src/pages/TermCardsPage';
import type { PuzzleCompletionResult } from '../src/types';
import { serverWallet } from './fixtures/wallet';
import { renderWithProviders } from './testUtils';

// 쉬움 5×5 "주식 기초"
const renderPuzzle = (user: AuthUser | null) =>
  renderWithProviders(
    <Routes>
      <Route path="/terms" element={<TermCardsPage />} />
    </Routes>,
    { route: '/terms?mode=crossword&puzzle=basics-easy', user },
  );

/** 정답 보기 없이 끝까지 풀어요. */
async function solve(user: ReturnType<typeof userEvent.setup>) {
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
    screen.getByRole('textbox', { name: /답 입력/ }).focus();
    await user.keyboard(`${answer}{Enter}`);
  }
  await screen.findByText('다 풀었어요!');
}

const completionCalls = () =>
  vi.mocked(fetch).mock.calls.filter(([url]) => String(url).includes('puzzle-completions'));

const result = (patch: Partial<PuzzleCompletionResult>): PuzzleCompletionResult => ({
  puzzle_progress: { done: 1, required: 3 },
  rewarded: false,
  balance: 50,
  reward_count_today: 0,
  reward_daily_limit: 2,
  ...patch,
});

describe('낱말퀴즈 3개 = +20 ADK', () => {
  it('완료 문구: 1~2개째 진행도, 3개째 보상, 정답 보기, 하루 한도', () => {
    expect(puzzleRewardText({ kind: 'result', result: result({}) })).toBe(
      '20 ADK까지 낱말퀴즈 1/3',
    );
    expect(
      puzzleRewardText({
        kind: 'result',
        result: result({ puzzle_progress: { done: 2, required: 3 } }),
      }),
    ).toBe('20 ADK까지 낱말퀴즈 2/3');
    expect(
      puzzleRewardText({
        kind: 'result',
        result: result({
          rewarded: true,
          puzzle_progress: { done: 0, required: 3 },
          reward_count_today: 1,
        }),
      }),
    ).toBe('+20 ADK를 받았어요 (오늘 보상 1/2)');
    expect(puzzleRewardText({ kind: 'revealed' })).toBe(
      '정답 보기를 사용한 퀴즈는 개수에 포함되지 않아요',
    );
    expect(puzzleRewardText({ kind: 'result', result: result({ reward_count_today: 2 }) })).toBe(
      '오늘 받을 수 있는 보상을 모두 받았어요',
    );
    expect(puzzleRewardText({ kind: 'guest' })).toBe('로그인하면 3개마다 20 ADK를 받을 수 있어요');
  });

  it('비로그인은 퀴즈를 풀 수 있지만 진행도·보상이 없어요 (서버에 보내지 않아요)', async () => {
    const user = userEvent.setup();
    renderPuzzle(null);
    expect(await screen.findByText('낱말퀴즈 3개를 풀면 20 ADK')).toBeInTheDocument();
    expect(screen.getByText('로그인하면 받을 수 있어요')).toBeInTheDocument();

    await solve(user);
    expect(screen.getByText('로그인하면 3개마다 20 ADK를 받을 수 있어요')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '로그인하기' }));
    expect(
      screen.getByRole('dialog', { name: 'Google로 로그인하면 가입 선물로 50 ADK를 드려요' }),
    ).toBeInTheDocument();
    expect(completionCalls()).toHaveLength(0);
  });

  it('로그인: 2/3 에서 하나 더 풀면 +20 ADK 를 받고 0/3 으로 다시 시작해요', async () => {
    serverWallet.setProgress(DEV_USER.id!, 2);
    const user = userEvent.setup();
    renderPuzzle(DEV_USER);
    expect(await screen.findByText('지금 2/3 · 오늘 보상 0/2')).toBeInTheDocument();

    await solve(user);
    expect(await screen.findByText('+20 ADK를 받았어요 (오늘 보상 1/2)')).toBeInTheDocument();
    expect(
      screen.getAllByText(/실제 돈이 아니며 실제 돈으로 사거나 바꿀 수 없어요/).length,
    ).toBeGreaterThan(0);
    expect(serverWallet.get(DEV_USER.id!)).toMatchObject({ balance: 70, done: 0, rewardCount: 1 });
    await waitFor(() => expect(screen.getByText('지금 0/3 · 오늘 보상 1/2')).toBeInTheDocument());
  });

  it('로그인: 정답 보기를 쓴 퀴즈는 개수에 넣지 않아요', async () => {
    const user = userEvent.setup();
    renderPuzzle(DEV_USER);
    await screen.findByText('지금 0/3 · 오늘 보상 0/2');
    await user.click(screen.getByRole('button', { name: '정답 보기' }));

    expect(
      await screen.findByText('정답 보기를 사용한 퀴즈는 개수에 포함되지 않아요'),
    ).toBeInTheDocument();
    expect(completionCalls()).toHaveLength(1);
    expect(serverWallet.get(DEV_USER.id!)?.done).toBe(0);
  });

  it('메인 용어 학습 진입에도 "낱말퀴즈 3개를 풀면 20 ADK" 를 안내해요', () => {
    renderWithProviders(<TermGameBanner />);
    expect(screen.getByText('낱말퀴즈 3개를 풀면 20 ADK')).toBeInTheDocument();
  });
});
