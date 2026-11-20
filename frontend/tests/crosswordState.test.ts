import { describe, expect, it } from 'vitest';
import {
  cellMarks,
  crosswordReducer,
  initialState,
  wrongCells,
  type CrosswordState,
} from '../src/features/crossword/crosswordState';
import { buildPuzzleModel } from '../src/features/crossword/puzzleModel';
import type { CrosswordCheckResult, CrosswordPuzzle } from '../src/types';

/** 가로 "주가" (0,0)-(0,1), 세로 "주주" (0,0)-(1,0). 정답은 서버만 알아서 칸 수만 있어요. */
const puzzle: CrosswordPuzzle = {
  id: 'tiny',
  title: '테스트',
  difficulty: 'easy',
  size: { rows: 2, cols: 2 },
  words: [
    { number: 1, direction: 'across', row: 0, col: 0, answer_length: 2, term_id: 'a', clue: '' },
    { number: 1, direction: 'down', row: 0, col: 0, answer_length: 2, term_id: 'b', clue: '' },
  ],
};
const model = buildPuzzleModel(puzzle);
const start = () => initialState(model);
const apply = (state: CrosswordState, ...actions: Parameters<typeof crosswordReducer>[2][]) =>
  actions.reduce((s, a) => crosswordReducer(model, s, a), state);

const verdict = (patch: Partial<CrosswordCheckResult>): CrosswordCheckResult => ({
  wrong_cells: [],
  correct_words: [],
  wrong_words: [],
  complete: false,
  ...patch,
});

describe('낱말퀴즈 상태: 채점은 서버가 해요', () => {
  it('단어를 채우거나 [확인]을 누를 때만 서버에 채점을 부탁해요 (요청 번호가 올라가요)', () => {
    const s0 = start();
    expect(s0.requestId).toBe(0);
    const s1 = apply(s0, { type: 'fill', text: '주가' });
    expect(s1.requestId).toBe(1);
    expect(apply(s1, { type: 'check' }).requestId).toBe(2);
    expect(apply(s1, { type: 'clickCell', key: '0,1' }).requestId).toBe(1);
  });

  it('이어 풀 때 채운 칸이 있으면 한 번 채점을 부탁해서 색을 되살려요', () => {
    const s = initialState(model, { entries: { '0,0': '주' } });
    expect(s.requestId).toBe(1);
    expect(s.verdict).toBeNull();
  });

  it('서버가 맞다고 한 단어는 초록, 틀리다고 한 단어는 빨강으로 칠해요', () => {
    const filled = apply(start(), { type: 'fill', text: '주가' });
    const s = apply(filled, {
      type: 'verdict',
      requestId: 1,
      entries: filled.entries,
      result: verdict({ correct_words: [0] }),
    });
    expect([...cellMarks(model, s).entries()]).toEqual([
      ['0,0', 'correct'],
      ['0,1', 'correct'],
    ]);
  });

  it('채점한 뒤에 바뀐 칸은 아직 채점 전이라 색을 칠하지 않아요', () => {
    const filled = apply(start(), { type: 'fill', text: '주가' });
    const judged = apply(filled, {
      type: 'verdict',
      requestId: 1,
      entries: filled.entries,
      result: verdict({ correct_words: [0] }),
    });
    const edited = { ...judged, entries: { ...judged.entries, '0,1': '지' } };
    expect(cellMarks(model, edited).size).toBe(0);
  });

  it('늦게 도착한 옛 채점 결과는 버려요', () => {
    const s0 = apply(start(), { type: 'fill', text: '주가' });
    const newer = apply(s0, {
      type: 'verdict',
      requestId: 2,
      entries: s0.entries,
      result: verdict({ correct_words: [0] }),
    });
    const stale = apply(newer, {
      type: 'verdict',
      requestId: 1,
      entries: {},
      result: verdict({ wrong_words: [0] }),
    });
    expect(stale.verdict?.correct_words).toEqual([0]);
  });

  it('"다 맞았다"는 서버가 채점한 칸에서 바뀐 게 없을 때만 믿어요', () => {
    const filled = apply(start(), { type: 'fill', text: '주가' });
    const changed = { ...filled, entries: { ...filled.entries, '1,0': '주' } };
    const ignored = apply(changed, {
      type: 'verdict',
      requestId: 1,
      entries: filled.entries,
      result: verdict({ complete: true }),
    });
    expect(ignored.complete).toBe(false);
    const accepted = apply(filled, {
      type: 'verdict',
      requestId: 1,
      entries: filled.entries,
      result: verdict({ complete: true }),
    });
    expect(accepted.complete).toBe(true);
  });

  it('[확인] 후 빨강은 서버가 틀리다고 한 칸이고, 그 뒤에 바꾼 칸은 빼요', () => {
    const filled = apply(start(), { type: 'fill', text: '주가' });
    const checked = apply(
      filled,
      { type: 'check' },
      {
        type: 'verdict',
        requestId: 2,
        entries: filled.entries,
        result: verdict({ wrong_cells: ['0,1'] }),
      },
    );
    expect([...wrongCells(model, checked)]).toEqual(['0,1']);
    const edited = { ...checked, entries: { ...checked.entries, '0,1': '지' } };
    expect(wrongCells(model, edited).size).toBe(0);
  });

  it('힌트 2단계는 서버가 준 첫 글자를 칸에 넣고, 같은 단계를 두 번 세지 않아요', () => {
    const s1 = apply(start(), { type: 'hintResult', index: 0, level: 1, choseong: 'ㅈㄱ' });
    expect(s1.hintsUsed).toBe(1);
    expect(s1.hintTexts[0]).toBe('ㅈㄱ');
    expect(s1.entries).toEqual({});
    const s2 = apply(s1, {
      type: 'hintResult',
      index: 0,
      level: 2,
      choseong: 'ㅈㄱ',
      firstChar: '주',
    });
    expect(s2.entries['0,0']).toBe('주');
    expect(s2.requestId).toBe(s1.requestId + 1); // 칸이 바뀌어서 다시 채점해요
    expect(
      apply(s2, { type: 'hintResult', index: 0, level: 2, choseong: 'ㅈㄱ', firstChar: '주' }),
    ).toBe(s2);
  });

  it('정답 보기는 서버가 준 정답으로 채우고, 내가 틀렸거나 비운 칸을 따로 표시해요', () => {
    const filled = apply(start(), { type: 'fill', text: '주가' });
    const s = apply(filled, {
      type: 'revealResult',
      answers: { '0,0': '주', '0,1': '값', '1,0': '주' },
    });
    expect(s.revealed).toBe(true);
    expect(s.entries).toEqual({ '0,0': '주', '0,1': '값', '1,0': '주' });
    expect(s.revealedKeys.sort()).toEqual(['0,1', '1,0']);
  });
});
