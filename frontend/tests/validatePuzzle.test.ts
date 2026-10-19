import { describe, expect, it } from 'vitest';
import { validatePuzzle } from '../src/features/crossword/validatePuzzle';
import crosswordsJson from '../src/mocks/crosswords.json';
import termsJson from '../src/mocks/terms.json';
import type { CrosswordPuzzle, Term } from '../src/types';

const puzzles = crosswordsJson as CrosswordPuzzle[];
const terms = termsJson as Term[];

/** 2×3 작은 퍼즐: 가로 "주가", 세로 "주주" 가 (0,0)에서 교차 */
const tiny = (): CrosswordPuzzle => ({
  id: 'tiny',
  title: '테스트',
  difficulty: 'easy',
  size: { rows: 2, cols: 3 },
  words: [
    {
      number: 1,
      direction: 'across',
      row: 0,
      col: 0,
      answer: '주가',
      term_id: 'stock_price',
      clue: '',
    },
    {
      number: 1,
      direction: 'down',
      row: 0,
      col: 0,
      answer: '주주',
      term_id: 'shareholder',
      clue: '',
    },
  ],
});

describe('validatePuzzle', () => {
  it('목 데이터 퍼즐 3개가 모두 검사를 통과해요', () => {
    expect(puzzles).toHaveLength(3);
    for (const puzzle of puzzles) {
      expect(validatePuzzle(puzzle), puzzle.id).toEqual({ ok: true, errors: [] });
    }
  });

  it('퍼즐 크기와 단어 수가 정해진 대로예요 (쉬움 5×5 1개, 보통 7×7 2개, 각 6~10단어)', () => {
    expect(puzzles.filter((p) => p.difficulty === 'easy' && p.size.rows === 5)).toHaveLength(1);
    expect(puzzles.filter((p) => p.difficulty === 'normal' && p.size.rows === 7)).toHaveLength(2);
    for (const p of puzzles) {
      expect(p.words.length).toBeGreaterThanOrEqual(6);
      expect(p.words.length).toBeLessThanOrEqual(10);
    }
  });

  it('정답은 실제 용어 데이터에 있는 용어예요', () => {
    for (const word of puzzles.flatMap((p) => p.words)) {
      const term = terms.find((t) => t.id === word.term_id);
      expect(term?.term, word.answer).toBe(word.answer);
      expect(word.clue.length, word.answer).toBeLessThanOrEqual(20);
    }
  });

  it('올바른 작은 퍼즐은 통과해요', () => {
    expect(validatePuzzle(tiny()).ok).toBe(true);
  });

  it('교차하는 칸의 글자가 다르면 잡아내요', () => {
    const puzzle = tiny();
    puzzle.words[1].answer = '가주';
    expect(validatePuzzle(puzzle).errors.join()).toMatch(/칸 글자가/);
  });

  it('격자 밖으로 나가면 잡아내요', () => {
    const puzzle = tiny();
    puzzle.words[0].answer = '주가지수';
    expect(validatePuzzle(puzzle).errors.join()).toMatch(/격자 밖/);
  });

  it('번호가 순서와 맞지 않으면 잡아내요', () => {
    const puzzle = tiny();
    puzzle.words[0].number = 2;
    expect(validatePuzzle(puzzle).errors.join()).toMatch(/번호가 2번인데 1번이어야/);
  });

  it('다른 단어와 교차하지 않는 단어를 잡아내요', () => {
    const puzzle = tiny();
    puzzle.size = { rows: 3, cols: 3 };
    puzzle.words[1] = { ...puzzle.words[1], row: 2, col: 1, direction: 'across', number: 2 };
    expect(validatePuzzle(puzzle).errors.join()).toMatch(/교차하지 않아요/);
  });

  it('옆 단어와 붙어서 생긴, 단어가 아닌 글자 줄을 잡아내요', () => {
    const puzzle = tiny();
    puzzle.words.push({
      number: 2,
      direction: 'down',
      row: 0,
      col: 1,
      answer: '가지',
      term_id: 'x',
      clue: '',
    });
    // (1,0) "주" 와 (1,1) "지" 가 가로로 붙어 "주지" 라는 단어가 아닌 줄이 생겨요.
    expect(validatePuzzle(puzzle).errors.join()).toMatch(/단어가 아닌 글자 줄/);
  });
});
