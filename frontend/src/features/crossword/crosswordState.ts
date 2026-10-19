import type { CrosswordDirection } from '../../types';
import { toChoseong } from './choseong';
import { sortedWords, wordAt, type PuzzleModel, type WordRef } from './puzzleModel';

/** 퍼즐 게임 상태 (화면과 분리된 순수 함수). useCrossword 훅이 이걸로 상태를 바꿔요. */
export interface CrosswordState {
  /** 칸("행,열")별로 입력한 글자 */
  entries: Record<string, string>;
  selected: { key: string; direction: CrosswordDirection };
  /** [확인]을 눌러 틀린 칸을 표시하는 중인지 (글자를 새로 넣으면 꺼져요) */
  checked: boolean;
  /** 단어(words 위치)별 힌트 단계: 1 초성, 2 한 글자 공개 */
  hintLevels: Record<number, number>;
  hintsUsed: number;
  /** [정답 보기]를 썼는지 */
  revealed: boolean;
  /** [정답 보기]로 채운 칸 (내가 틀렸거나 비워 둔 칸). 맞힌 칸과 다른 색으로 보여줘요. */
  revealedKeys: string[];
  /** 입력창 안내 (예: "4글자 단어예요") */
  message: string | null;
  /** 다 입력해서 채점한 단어(words 위치). 맞으면 초록, 틀리면 빨강으로 칸을 칠해요. */
  judged: number[];
}

export type CrosswordAction =
  | { type: 'clickCell'; key: string }
  | { type: 'selectWord'; index: number }
  | { type: 'move'; dRow: number; dCol: number }
  | { type: 'nextWord'; step: 1 | -1 }
  | { type: 'fill'; text: string }
  | { type: 'check' }
  | { type: 'hint' }
  | { type: 'reveal' }
  | { type: 'restart' }
  | { type: 'clearMessage' };

/** 열쇠 순서: 가로 번호 순 → 세로 번호 순 */
export const clueOrder = (model: PuzzleModel) => [
  ...sortedWords(model, 'across'),
  ...sortedWords(model, 'down'),
];

export function initialState(
  model: PuzzleModel,
  saved?: Partial<
    Pick<CrosswordState, 'entries' | 'hintLevels' | 'hintsUsed' | 'revealed' | 'revealedKeys'>
  >,
): CrosswordState {
  const first = clueOrder(model)[0];
  const entries = saved?.entries ?? {};
  return {
    entries,
    selected: { key: first.cells[0], direction: first.word.direction },
    checked: false,
    hintLevels: saved?.hintLevels ?? {},
    hintsUsed: saved?.hintsUsed ?? 0,
    revealed: saved?.revealed ?? false,
    revealedKeys: saved?.revealedKeys ?? [],
    message: null,
    // 이어 풀 때는 다 채워진 단어를 채점한 것으로 봐요.
    judged: model.words
      .filter((ref) => ref.cells.every((key) => entries[key]))
      .map((ref) => ref.index),
  };
}

export const currentWord = (model: PuzzleModel, state: CrosswordState) =>
  wordAt(model, state.selected.key, state.selected.direction) as WordRef;

const selectRef = (ref: WordRef): CrosswordState['selected'] => ({
  key: ref.cells[0],
  direction: ref.word.direction,
});

/** 입력한 글자 그대로 (띄어쓰기는 지워요) */
const toChars = (text: string) => [...text.normalize('NFC').replace(/\s+/g, '')];

export function isComplete(model: PuzzleModel, entries: Record<string, string>) {
  return [...model.cells.values()].every((cell) => entries[cell.key] === cell.answer);
}

/**
 * 칸 색: 채점한 단어가 모두 맞으면 초록, 하나라도 틀리면 빨강.
 * 맞은 단어와 틀린 단어가 겹치는 칸은 초록으로 둬요. [확인]으로 찾은 틀린 칸도 빨강이에요.
 */
export type CellMark = 'correct' | 'wrong' | 'revealed';

export function cellMarks(model: PuzzleModel, state: CrosswordState) {
  const marks = new Map<string, CellMark>();
  for (const index of state.judged) {
    const ref = model.words[index];
    const right = ref.cells.every((key, i) => state.entries[key] === [...ref.word.answer][i]);
    for (const key of ref.cells) {
      if (right) marks.set(key, 'correct');
      else if (marks.get(key) !== 'correct') marks.set(key, 'wrong');
    }
  }
  for (const key of wrongCells(model, state)) marks.set(key, 'wrong');
  // 정답 보기: 내가 맞힌 칸은 초록 그대로, 나머지는 정답 색으로
  if (state.revealed) {
    model.cells.forEach((cell) => {
      marks.set(cell.key, state.revealedKeys.includes(cell.key) ? 'revealed' : 'correct');
    });
  }
  return marks;
}

/** [확인] 후 빨간색으로 표시할 칸: 글자를 넣었는데 틀린 칸 */
export function wrongCells(model: PuzzleModel, state: CrosswordState) {
  if (!state.checked) return new Set<string>();
  return new Set(
    [...model.cells.values()]
      .filter((cell) => state.entries[cell.key] && state.entries[cell.key] !== cell.answer)
      .map((cell) => cell.key),
  );
}

/** 선택한 단어의 초성 힌트 (힌트 1단계 이상일 때) */
export function wordHint(model: PuzzleModel, state: CrosswordState) {
  const ref = currentWord(model, state);
  return (state.hintLevels[ref.index] ?? 0) >= 1 ? toChoseong(ref.word.answer) : null;
}

export function crosswordReducer(
  model: PuzzleModel,
  state: CrosswordState,
  action: CrosswordAction,
): CrosswordState {
  switch (action.type) {
    case 'clickCell': {
      const cell = model.cells.get(action.key);
      if (!cell) return state;
      const other = state.selected.direction === 'across' ? 'down' : 'across';
      // 같은 칸을 다시 누르면 가로 ↔ 세로 (그 방향 단어가 있을 때만)
      const direction =
        state.selected.key === action.key && cell[other] !== undefined
          ? other
          : cell[state.selected.direction] !== undefined
            ? state.selected.direction
            : other;
      return { ...state, selected: { key: action.key, direction }, message: null };
    }
    case 'selectWord': {
      const ref = model.words[action.index];
      return ref ? { ...state, selected: selectRef(ref), message: null } : state;
    }
    case 'move': {
      // 방향키: 그 방향으로 가장 가까운 글자 칸으로 (막힌 칸은 건너뛰어요)
      const [row, col] = state.selected.key.split(',').map(Number);
      for (let r = row + action.dRow, c = col + action.dCol; ; r += action.dRow, c += action.dCol) {
        if (r < 0 || c < 0 || r >= model.rows || c >= model.cols) return state;
        const key = `${r},${c}`;
        const cell = model.cells.get(key);
        if (!cell) continue;
        const axis: CrosswordDirection = action.dCol !== 0 ? 'across' : 'down';
        const direction = cell[axis] !== undefined ? axis : state.selected.direction;
        return {
          ...state,
          selected: {
            key,
            direction:
              cell[direction] !== undefined ? direction : axis === 'across' ? 'down' : 'across',
          },
          message: null,
        };
      }
    }
    case 'nextWord': {
      const order = clueOrder(model);
      const current = currentWord(model, state);
      const at = order.findIndex((ref) => ref.index === current.index);
      const next = order[(at + action.step + order.length) % order.length];
      return { ...state, selected: selectRef(next), message: null };
    }
    case 'fill': {
      const ref = currentWord(model, state);
      const chars = toChars(action.text);
      if (chars.length === 0) return state;
      if (chars.length !== ref.cells.length) {
        return { ...state, message: `${ref.cells.length}글자 단어예요` };
      }
      const entries = { ...state.entries };
      ref.cells.forEach((key, i) => {
        entries[key] = chars[i];
      });
      // 다음으로 빈 칸이 있는 단어로 넘어가요.
      const order = clueOrder(model);
      const at = order.findIndex((r) => r.index === ref.index);
      const next = [...order.slice(at + 1), ...order.slice(0, at)].find((r) =>
        r.cells.some((key) => !entries[key]),
      );
      return {
        ...state,
        entries,
        checked: false,
        message: null,
        judged: state.judged.includes(ref.index) ? state.judged : [...state.judged, ref.index],
        selected: next ? selectRef(next) : state.selected,
      };
    }
    case 'check':
      return { ...state, checked: true, message: null };
    case 'hint': {
      const ref = currentWord(model, state);
      const level = state.hintLevels[ref.index] ?? 0;
      if (level >= 2) return state;
      const entries =
        level === 1 ? { ...state.entries, [ref.cells[0]]: [...ref.word.answer][0] } : state.entries;
      return {
        ...state,
        entries,
        hintLevels: { ...state.hintLevels, [ref.index]: level + 1 },
        hintsUsed: state.hintsUsed + 1,
        message: null,
      };
    }
    case 'reveal': {
      const entries: Record<string, string> = {};
      model.cells.forEach((cell) => {
        entries[cell.key] = cell.answer;
      });
      const revealedKeys = [...model.cells.values()]
        .filter((cell) => state.entries[cell.key] !== cell.answer)
        .map((cell) => cell.key);
      return { ...state, entries, revealed: true, revealedKeys, checked: false, message: null };
    }
    case 'restart':
      return initialState(model);
    case 'clearMessage':
      return state.message ? { ...state, message: null } : state;
    default:
      return state;
  }
}
