import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { CrosswordListPage } from '../src/pages/CrosswordListPage';
import { CrosswordPage } from '../src/pages/CrosswordPage';
import { renderWithProviders } from './testUtils';

// 쉬움 5×5 "주식 기초"
// 가로: 3 주가지수, 5 주주, 7 회계연도 / 세로: 1 주가, 2 매수, 3 주주총회, 4 지분, 6 매도
const renderPuzzle = () =>
  renderWithProviders(
    <Routes>
      <Route path="/learn/crossword/:puzzleId" element={<CrosswordPage />} />
    </Routes>,
    { route: '/learn/crossword/basics-easy' },
  );

const input = () => screen.getByRole('textbox');
const cell = (label: RegExp) => screen.getByRole('button', { name: label });

describe('가로세로 낱말퀴즈', () => {
  it('선택한 단어를 한 번에 입력하고 Enter 로 칸을 채워요', async () => {
    const user = userEvent.setup();
    renderPuzzle();

    // 처음에는 가로 3번(주가지수)이 골라져 있어요.
    expect(await screen.findByText('가로 3번')).toBeInTheDocument();
    await user.type(input(), '주가지수{Enter}');

    expect(cell(/^가로 3번, 1번째 칸, 세로 3번, 1번째 칸, 입력: 주$/)).toBeInTheDocument();
    expect(cell(/^가로 3번, 4번째 칸, 세로 2번, 2번째 칸, 입력: 수$/)).toBeInTheDocument();
    // 빈 칸이 있는 다음 단어(가로 5번)로 넘어가요.
    expect(screen.getByText('가로 5번')).toBeInTheDocument();
  });

  it('글자 수가 다르면 "N글자 단어예요"라고 알려줘요', async () => {
    const user = userEvent.setup();
    renderPuzzle();
    await user.type(await screen.findByRole('textbox'), '주가{Enter}');
    expect(screen.getByText('4글자 단어예요')).toBeInTheDocument();
    expect(cell(/^가로 3번, 1번째 칸, 세로 3번, 1번째 칸, 비어 있음$/)).toBeInTheDocument();
  });

  it('같은 칸을 다시 누르면 가로 ↔ 세로가 바뀌고, 교차 칸 글자는 입력창에 미리 보여요', async () => {
    const user = userEvent.setup();
    renderPuzzle();
    await user.type(await screen.findByRole('textbox'), '주가지수{Enter}');

    const shared = cell(/^가로 3번, 1번째 칸, 세로 3번, 1번째 칸/);
    await user.click(shared);
    expect(screen.getByText('가로 3번')).toBeInTheDocument();
    await user.click(shared);
    expect(screen.getByText('세로 3번')).toBeInTheDocument();
    // 세로 3번(주주총회)의 첫 칸은 이미 "주"가 들어 있어요.
    expect(input()).toHaveAttribute('placeholder', '주○○○');
  });

  it('[확인]은 틀린 칸만 표시하고, 끝까지 맞히면 완료 화면과 용어 목록을 보여줘요', async () => {
    const user = userEvent.setup();
    renderPuzzle();
    const clues = await screen.findByRole('complementary', { name: '열쇠 목록' });
    const answers: [string, string][] = [
      ['3', '주가지수'],
      ['5', '주주'],
      ['7', '회계연도'],
      ['1', '주가'],
      ['2', '매수'],
      ['3', '주주총회'],
      ['4', '지분'],
      ['6', '매도'],
    ];
    const across = within(clues).getByRole('region', { name: '가로 열쇠' });
    const down = within(clues).getByRole('region', { name: '세로 열쇠' });

    // 일부러 한 단어를 틀리게 넣고 확인해요.
    await user.click(within(across).getByRole('button', { name: /^7/ }));
    await user.type(input(), '회계년도{Enter}');
    await user.click(screen.getByRole('button', { name: '확인' }));
    expect(screen.getByText('틀린 칸 1개를 빨간색으로 표시했어요')).toBeInTheDocument();

    for (const [i, [number, answer]] of answers.entries()) {
      const list = i < 3 ? across : down;
      await user.click(within(list).getByRole('button', { name: new RegExp(`^${number}`) }));
      await user.type(input(), `${answer}{Enter}`);
    }

    expect(await screen.findByRole('heading', { name: '최고 기록이에요!' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /주주총회/ })).toBeInTheDocument();
    const saved = JSON.parse(window.localStorage.getItem('dajin:crossword') ?? '{}');
    expect(saved['basics-easy'].ever_completed).toBe(true);
  });

  it('나갔다 와도 입력한 글자가 남아 있어 이어서 풀 수 있어요', async () => {
    const user = userEvent.setup();
    const first = renderPuzzle();
    await user.type(await screen.findByRole('textbox'), '주가지수{Enter}');
    first.unmount();

    renderPuzzle();
    expect(
      await screen.findByRole('button', {
        name: /^가로 3번, 4번째 칸, 세로 2번, 2번째 칸, 입력: 수$/,
      }),
    ).toBeInTheDocument();
  });

  it('퍼즐 목록에 난이도·단어 수·상태를 보여줘요', async () => {
    renderWithProviders(<CrosswordListPage />);
    const list = await screen.findByRole('list', { name: '퍼즐 목록' });
    expect(await within(list).findAllByRole('link')).toHaveLength(3);
    expect(within(list).getByText(/5×5 · 8단어 · 시작 전/)).toBeInTheDocument();
  });
});
