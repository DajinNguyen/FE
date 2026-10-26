import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { TermCardsPage } from '../src/pages/TermCardsPage';
import { renderWithProviders } from './testUtils';

// 쉬움 5×5 "주식 기초"
// 가로: 3 주가지수, 5 주주, 7 회계연도 / 세로: 1 주가, 2 매수, 3 주주총회, 4 지분, 6 매도
const renderPuzzle = (route = '/terms?mode=crossword&puzzle=basics-easy') =>
  renderWithProviders(
    <Routes>
      <Route path="/terms" element={<TermCardsPage />} />
    </Routes>,
    { route },
  );

/** 격자 위에 겹친 입력창 (지금 고른 단어) */
const wordInput = () => screen.getByRole('textbox', { name: /답 입력/ });
const cell = (label: RegExp) => screen.getByRole('button', { name: label });

/** 칸에 바로 친 것처럼: 입력창에 포커스를 주고 키보드로 입력 */
async function typeInGrid(user: ReturnType<typeof userEvent.setup>, text: string) {
  wordInput().focus();
  await user.keyboard(text);
}

describe('가로세로 낱말퀴즈', () => {
  it('칸 위에서 바로 입력하면 친 글자가 칸에 보이고, Enter 로 채점해서 맞으면 초록으로 칠해요', async () => {
    const user = userEvent.setup();
    renderPuzzle();

    expect(
      await screen.findByRole('textbox', { name: '가로 3번 답 입력 (4글자)' }),
    ).toBeInTheDocument();
    await typeInGrid(user, '주가');
    // Enter 전에도 친 글자가 칸에 바로 보여요.
    expect(cell(/^가로 3번, 2번째 칸/)).toHaveTextContent('가');

    await typeInGrid(user, '지수{Enter}');
    const first = cell(/^가로 3번, 1번째 칸, 세로 3번, 1번째 칸, 입력: 주, 맞음$/);
    expect(first).toHaveAttribute('data-mark', 'correct');
    expect(cell(/^가로 3번, 4번째 칸/)).toHaveAttribute('data-mark', 'correct');
    // 빈 칸이 있는 다음 단어(가로 5번)로 넘어가요.
    expect(screen.getByRole('textbox', { name: '가로 5번 답 입력 (2글자)' })).toBeInTheDocument();
  });

  it('틀린 단어는 빨강으로 칠하고, 고쳐서 맞히면 초록으로 바뀌어요', async () => {
    const user = userEvent.setup();
    renderPuzzle();
    const clues = await screen.findByRole('complementary', { name: '열쇠 목록' });
    const across = within(clues).getByRole('region', { name: '가로 열쇠' });

    await user.click(within(across).getByRole('button', { name: /^7/ }));
    await typeInGrid(user, '회계년도{Enter}');
    expect(cell(/^가로 7번, 3번째 칸/)).toHaveAttribute('data-mark', 'wrong');

    await user.click(within(across).getByRole('button', { name: /^7/ }));
    await typeInGrid(user, '회계연도{Enter}');
    expect(cell(/^가로 7번, 3번째 칸/)).toHaveAttribute('data-mark', 'correct');
  });

  it('글자 수가 다르면 "N글자 단어예요"라고 알려주고 칸을 채우지 않아요', async () => {
    const user = userEvent.setup();
    renderPuzzle();
    await screen.findByRole('textbox', { name: /가로 3번/ });
    await typeInGrid(user, '주가{Enter}');
    expect(screen.getByText('4글자 단어예요')).toBeInTheDocument();
    expect(cell(/^가로 3번, 1번째 칸, 세로 3번, 1번째 칸, 비어 있음$/)).not.toHaveAttribute(
      'data-mark',
    );
  });

  it('같은 칸을 다시 누르면 가로 ↔ 세로가 바뀌어요', async () => {
    const user = userEvent.setup();
    renderPuzzle();
    await screen.findByRole('textbox', { name: /가로 3번/ });

    // 처음에는 이 칸(가로 3번 첫 칸)이 골라져 있어서, 한 번 누르면 바로 세로로 바뀌어요.
    expect(wordInput()).toHaveAccessibleName('가로 3번 답 입력 (4글자)');
    const shared = cell(/^가로 3번, 1번째 칸, 세로 3번, 1번째 칸/);
    await user.click(shared);
    expect(wordInput()).toHaveAccessibleName('세로 3번 답 입력 (4글자)');
    expect(screen.getByText('세로 3번')).toBeInTheDocument();
    await user.click(shared);
    expect(wordInput()).toHaveAccessibleName('가로 3번 답 입력 (4글자)');
  });

  it('끝까지 맞히면 다른 화면으로 넘어가지 않고 격자에서 바로 "다 풀었어요"를 보여주고, 기록은 쌓지 않아요', async () => {
    const user = userEvent.setup();
    renderPuzzle();
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
      await typeInGrid(user, `${answer}{Enter}`);
    }

    expect(await screen.findByText('다 풀었어요!')).toBeInTheDocument();
    // 격자는 그대로 있고 모든 칸이 초록이에요.
    expect(cell(/^가로 7번, 4번째 칸/)).toHaveAttribute('data-mark', 'correct');
    expect(screen.queryByText(/최고 기록/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '정답 보기' })).toBeDisabled();
    const saved = JSON.parse(window.localStorage.getItem('dajin:crossword') ?? '{}');
    expect(saved['basics-easy']).not.toHaveProperty('best_ms');
  });

  it('[정답 보기]는 확인 창 없이 격자에 바로 정답을 채우고, 내가 맞힌 칸과 구분해요', async () => {
    const user = userEvent.setup();
    renderPuzzle();
    await screen.findByRole('textbox', { name: /가로 3번/ });
    await typeInGrid(user, '주가지수{Enter}');

    await user.click(screen.getByRole('button', { name: '정답 보기' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByText('정답을 채웠어요')).toBeInTheDocument();
    expect(cell(/^가로 3번, 4번째 칸/)).toHaveAttribute('data-mark', 'correct');
    expect(cell(/^가로 7번, 1번째 칸, 세로 3번, 4번째 칸, 입력: 회/)).toHaveAttribute(
      'data-mark',
      'revealed',
    );

    await user.click(screen.getByRole('button', { name: '다시 하기' }));
    expect(cell(/^가로 7번, 1번째 칸, 세로 3번, 4번째 칸, 비어 있음$/)).not.toHaveAttribute(
      'data-mark',
    );
  });

  it('나갔다 와도 입력한 글자와 색이 남아 있어 이어서 풀 수 있어요', async () => {
    const user = userEvent.setup();
    const first = renderPuzzle();
    await screen.findByRole('textbox', { name: /가로 3번/ });
    await typeInGrid(user, '주가지수{Enter}');
    first.unmount();

    renderPuzzle();
    expect(
      await screen.findByRole('button', {
        name: /^가로 3번, 4번째 칸, 세로 2번, 2번째 칸, 입력: 수, 맞음$/,
      }),
    ).toHaveAttribute('data-mark', 'correct');
  });

  it('용어 카드 화면에서 [낱말퀴즈]를 누르면 목록 없이 바로 퍼즐이 나오고, 위에서 퍼즐을 바꿀 수 있어요', async () => {
    const user = userEvent.setup();
    renderPuzzle('/terms');

    await user.click(await screen.findByRole('radio', { name: '낱말퀴즈' }));
    const picker = await screen.findByRole('group', { name: '퍼즐 고르기' });
    expect(within(picker).getAllByRole('button')).toHaveLength(3);
    expect(within(picker).getByRole('button', { name: /주식 기초/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(await screen.findByText('가로 3번')).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: '용어 분류' })).not.toBeInTheDocument();

    await user.click(within(picker).getByRole('button', { name: /시장과 산업/ }));
    const clues = await screen.findByRole('complementary', { name: '열쇠 목록' });
    expect(within(clues).getByRole('region', { name: '가로 열쇠' })).toHaveTextContent(
      '한국은행이 정하는 이자율 기준',
    );
  });
});
