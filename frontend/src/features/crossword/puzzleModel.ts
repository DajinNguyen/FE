import type { CrosswordDirection, CrosswordPuzzle, CrosswordWord } from '../../types';

/**
 * 퍼즐 데이터 → 화면에서 쓰기 좋은 칸 정보 (화면과 분리된 계산)
 * 나중에 퍼즐을 자동으로 만들게 되어도 같은 형식의 CrosswordPuzzle 만 넘기면 돼요.
 */
export interface WordRef {
  /** puzzle.words 안의 위치 */
  index: number;
  word: CrosswordWord;
  /** 이 단어가 지나는 칸 ("행,열") 순서대로 */
  cells: string[];
}

export interface CellInfo {
  key: string;
  row: number;
  col: number;
  /** 정답 글자 */
  answer: string;
  /** 단어가 시작하는 칸이면 번호 */
  number?: number;
  across?: number;
  down?: number;
}

export const cellKey = (row: number, col: number) => `${row},${col}`;

export function wordCells(word: Pick<CrosswordWord, 'row' | 'col' | 'direction' | 'answer'>) {
  return [...word.answer].map((_, i) =>
    word.direction === 'across' ? cellKey(word.row, word.col + i) : cellKey(word.row + i, word.col),
  );
}

export interface PuzzleModel {
  rows: number;
  cols: number;
  cells: Map<string, CellInfo>;
  words: WordRef[];
}

/** 퍼즐을 칸 지도로 바꿔요. (validatePuzzle 을 통과한 퍼즐이라고 가정해요) */
export function buildPuzzleModel(puzzle: CrosswordPuzzle): PuzzleModel {
  const cells = new Map<string, CellInfo>();
  const words = puzzle.words.map((word, index) => ({ index, word, cells: wordCells(word) }));
  for (const ref of words) {
    const chars = [...ref.word.answer];
    ref.cells.forEach((key, i) => {
      const [row, col] = key.split(',').map(Number);
      const cell = cells.get(key) ?? { key, row, col, answer: chars[i] };
      cell[ref.word.direction] = ref.index;
      if (i === 0) cell.number = ref.word.number;
      cells.set(key, cell);
    });
  }
  return { rows: puzzle.size.rows, cols: puzzle.size.cols, cells, words };
}

/** 이 칸에서 고를 단어. 원하는 방향이 없으면 다른 방향 단어를 골라요. */
export function wordAt(
  model: PuzzleModel,
  key: string,
  preferred: CrosswordDirection,
): WordRef | undefined {
  const cell = model.cells.get(key);
  if (!cell) return undefined;
  const index = cell[preferred] ?? cell[preferred === 'across' ? 'down' : 'across'];
  return index === undefined ? undefined : model.words[index];
}

/** 열쇠 목록 순서: 번호 순 */
export const sortedWords = (model: PuzzleModel, direction: CrosswordDirection) =>
  model.words
    .filter((ref) => ref.word.direction === direction)
    .sort((a, b) => a.word.number - b.word.number);
