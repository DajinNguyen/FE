import type { CrosswordPuzzle } from '../../types';
import { cellKey, wordCells } from './puzzleModel';

export interface PuzzleCheck {
  ok: boolean;
  errors: string[];
}

const HANGUL_SYLLABLE = /^[가-힣]+$/;

/**
 * 퍼즐 데이터가 올바른지 검사해요.
 * - 단어가 격자 밖으로 나가지 않는지
 * - 교차하는 칸의 글자가 서로 같은지
 * - 번호가 위→아래, 왼→오른쪽 순서로 맞게 붙었는지
 * - 모든 단어가 최소 1번 다른 단어와 교차하는지
 * - (추가) 정답이 한글 음절로만 되어 있는지, 같은 칸·같은 방향에서 시작하는 단어가 겹치지 않는지,
 *   단어가 아닌 글자 줄(옆 단어와 붙어서 생긴 줄)이 없는지
 */
export function validatePuzzle(puzzle: CrosswordPuzzle): PuzzleCheck {
  const errors: string[] = [];
  const { rows, cols } = puzzle.size;
  const letters = new Map<string, string>();
  const owners = new Map<string, number[]>();
  const starts = new Set<string>();

  puzzle.words.forEach((word, index) => {
    const label = `${word.number}번 ${word.direction === 'across' ? '가로' : '세로'} "${word.answer}"`;
    if (!HANGUL_SYLLABLE.test(word.answer)) errors.push(`${label}: 한글 음절만 쓸 수 있어요`);

    const startKey = `${word.direction}:${cellKey(word.row, word.col)}`;
    if (starts.has(startKey)) errors.push(`${label}: 같은 칸·방향에서 시작하는 단어가 또 있어요`);
    starts.add(startKey);

    const chars = [...word.answer];
    wordCells(word).forEach((key, i) => {
      const [r, c] = key.split(',').map(Number);
      if (r < 0 || c < 0 || r >= rows || c >= cols) {
        errors.push(`${label}: ${i + 1}번째 글자가 격자 밖이에요`);
        return;
      }
      const prev = letters.get(key);
      if (prev !== undefined && prev !== chars[i]) {
        errors.push(`${label}: (${r},${c}) 칸 글자가 "${prev}"와 달라요`);
      }
      letters.set(key, chars[i]);
      owners.set(key, [...(owners.get(key) ?? []), index]);
    });
  });

  // 교차 여부
  puzzle.words.forEach((word, index) => {
    const crosses = wordCells(word).some((key) => (owners.get(key) ?? []).some((o) => o !== index));
    if (!crosses) errors.push(`${word.number}번 "${word.answer}": 다른 단어와 교차하지 않아요`);
  });

  // 번호 순서: 시작 칸을 위→아래, 왼→오른쪽으로 세면 1, 2, 3...
  const startCells = [...new Set(puzzle.words.map((w) => cellKey(w.row, w.col)))].sort((a, b) => {
    const [ar, ac] = a.split(',').map(Number);
    const [br, bc] = b.split(',').map(Number);
    return ar - br || ac - bc;
  });
  const expected = new Map(startCells.map((key, i) => [key, i + 1]));
  for (const word of puzzle.words) {
    const want = expected.get(cellKey(word.row, word.col));
    if (word.number !== want) {
      errors.push(`"${word.answer}": 번호가 ${word.number}번인데 ${want}번이어야 해요`);
    }
  }

  // 단어가 아닌 글자 줄 (가로·세로로 2칸 이상 이어진 글자는 모두 단어여야 해요)
  const wordAtStart = new Map(
    puzzle.words.map((w) => [`${w.direction}:${cellKey(w.row, w.col)}`, w.answer]),
  );
  const scan = (direction: 'across' | 'down') => {
    const outer = direction === 'across' ? rows : cols;
    const inner = direction === 'across' ? cols : rows;
    for (let a = 0; a < outer; a += 1) {
      let run = '';
      let start = 0;
      for (let b = 0; b <= inner; b += 1) {
        const key = direction === 'across' ? cellKey(a, b) : cellKey(b, a);
        const ch = b < inner ? letters.get(key) : undefined;
        if (ch) {
          if (!run) start = b;
          run += ch;
          continue;
        }
        if (run.length > 1) {
          const startKey = direction === 'across' ? cellKey(a, start) : cellKey(start, a);
          if (wordAtStart.get(`${direction}:${startKey}`) !== run) {
            errors.push(
              `${direction === 'across' ? '가로' : '세로'} (${startKey}) "${run}": 단어가 아닌 글자 줄이에요`,
            );
          }
        }
        run = '';
      }
    }
  };
  scan('across');
  scan('down');

  return { ok: errors.length === 0, errors };
}
