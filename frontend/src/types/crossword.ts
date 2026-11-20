/** 가로세로 낱말퀴즈 */
export type CrosswordDirection = 'across' | 'down';

export interface CrosswordWord {
  /** 단어가 시작하는 칸의 번호 (위→아래, 왼→오른쪽 순서) */
  number: number;
  direction: CrosswordDirection;
  /** 시작 칸 (0부터) */
  row: number;
  col: number;
  /** 칸 수 (정답 글자 수). 정답은 서버만 알아요 — 채운 칸은 서버에 보내서 확인해요 */
  answer_length: number;
  /**
   * 정답. 서버가 정답을 감춘 뒤로는 오지 않아요 (호환 기간에만 와요). 화면은 이 값을 쓰지 않아요.
   * 퍼즐 데이터 검사(validatePuzzle)에서만 있으면 읽어요.
   */
  answer?: string;
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

/** POST /api/learn/crosswords/{id}/check 응답: 서버가 채운 칸을 정답과 비교한 결과 */
export interface CrosswordCheckResult {
  /** 글자를 넣었는데 틀린 칸 ("행,열") */
  wrong_cells: string[];
  /** 모든 칸이 채워졌고 맞은 단어 (words 의 위치) */
  correct_words: number[];
  /** 모든 칸이 채워졌는데 틀린 단어 */
  wrong_words: number[];
  /** 모든 칸이 맞았는지 */
  complete: boolean;
}

/** POST /api/learn/crosswords/{id}/hint 응답 */
export interface CrosswordHintResult {
  choseong: string;
  /** 2단계 힌트일 때만 */
  first_char: string | null;
}

/** POST /api/learn/crosswords/{id}/reveal 응답: "행,열" → 정답 글자 */
export interface CrosswordRevealResult {
  answers: Record<string, string>;
}
