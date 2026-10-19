/** 가로세로 낱말퀴즈 */
export type CrosswordDirection = 'across' | 'down';

export interface CrosswordWord {
  /** 단어가 시작하는 칸의 번호 (위→아래, 왼→오른쪽 순서) */
  number: number;
  direction: CrosswordDirection;
  /** 시작 칸 (0부터) */
  row: number;
  col: number;
  /** 정답. 한 칸에 한글 한 음절이에요. (영어 약어는 쓰지 않아요) */
  answer: string;
  term_id: string;
  /** 열쇠 (용어의 crossword_clue) */
  clue: string;
}

/** GET /api/learn/crosswords/{id} 응답 */
export interface CrosswordPuzzle {
  id: string;
  title: string;
  difficulty: 'easy' | 'normal';
  size: { rows: number; cols: number };
  words: CrosswordWord[];
}

/** GET /api/learn/crosswords 응답 항목 (목록에는 칸 정보 없이) */
export type CrosswordSummary = Pick<CrosswordPuzzle, 'id' | 'title' | 'difficulty' | 'size'> & {
  word_count: number;
};
