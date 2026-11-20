import type { CrosswordCheckResult, CrosswordDirection } from '../../types';
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
  /** 단어별 초성 힌트 글자 (서버가 줬어요) */
  hintTexts: Record<number, string>;
  hintsUsed: number;
  /** [정답 보기]를 썼는지 */
  revealed: boolean;
  /** [정답 보기]로 채운 칸 (내가 틀렸거나 비워 둔 칸). 맞힌 칸과 다른 색으로 보여줘요. */
  revealedKeys: string[];
  /** 입력창 안내 (예: "4글자 단어예요") */
  message: string | null;
  /**
   * 서버가 채점한 마지막 결과와, 그때의 칸. 정답은 서버만 알아서 채점은 서버에 부탁해요.
   * 그 뒤에 바뀐 칸은 아직 채점 전이라 색을 칠하지 않아요.
   */
  verdict: CrosswordCheckResult | null;
  verdictEntries: Record<string, string>;
  /** 이 숫자가 올라갈 때마다 서버에 채점을 부탁해요 (단어를 채우거나 [확인]을 눌렀을 때) */
  requestId: number;
  /** 받은 채점 결과의 요청 번호 (늦게 도착한 옛 결과는 버려요) */
  verdictId: number;
  /** 서버가 "다 맞았다"고 확인했는지 */
  complete: boolean;
}

export type CrosswordAction =
  | { type: 'clickCell'; key: string }
  | { type: 'selectWord'; index: number }
  | { type: 'move'; dRow: number; dCol: number }
  | { type: 'nextWord'; step: 1 | -1 }
  | { type: 'fill'; text: string }
  | { type: 'check' }
  | { type: 'restart' }
  | { type: 'clearMessage' }
  // 서버에서 돌아온 결과
  | {
      type: 'verdict';
      requestId: number;
      result: CrosswordCheckResult;
      entries: Record<string, string>;
    }
  | { type: 'hintResult'; index: number; level: 1 | 2; choseong: string; firstChar?: string }
  | { type: 'revealResult'; answers: Record<string, string> }
  | { type: 'requestFailed' };

/** 열쇠 순서: 가로 번호 순 → 세로 번호 순 */
export const clueOrder = (model: PuzzleModel) => [
  ...sortedWords(model, 'across'),
  ...sortedWords(model, 'down'),
];

export function initialState(
  model: PuzzleModel,
  saved?: Partial<
    Pick<
      CrosswordState,
      | 'entries'
      | 'hintLevels'
      | 'hintTexts'
      | 'hintsUsed'
      | 'revealed'
      | 'revealedKeys'
      | 'complete'
    >
  >,
): CrosswordState {
  const first = clueOrder(model)[0];
  const entries = saved?.entries ?? {};
  return {
    entries,
    selected: { key: first.cells[0], direction: first.word.direction },
    checked: false,
    hintLevels: saved?.hintLevels ?? {},
    hintTexts: saved?.hintTexts ?? {},
    hintsUsed: saved?.hintsUsed ?? 0,
    revealed: saved?.revealed ?? false,
    revealedKeys: saved?.revealedKeys ?? [],
    message: null,
    verdict: null,
    verdictEntries: {},
    // 이어 풀 때는 채운 칸이 있으면 한 번 채점을 부탁해서 색을 되살려요.
    requestId: Object.keys(entries).length > 0 ? 1 : 0,
    verdictId: 0,
    complete: saved?.complete ?? false,
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

/**
 * 칸 색: 채점한 단어가 모두 맞으면 초록, 하나라도 틀리면 빨강.
 * 맞은 단어와 틀린 단어가 겹치는 칸은 초록으로 둬요. [확인]으로 찾은 틀린 칸도 빨강이에요.
 */
export type CellMark = 'correct' | 'wrong' | 'revealed';

/** 채점 결과를 받은 뒤로 이 칸들이 바뀌지 않았는지 */
const unchangedSince = (state: CrosswordState, keys: string[]) =>
  keys.every((key) => state.entries[key] === state.verdictEntries[key]);

export function cellMarks(model: PuzzleModel, state: CrosswordState) {
  const marks = new Map<string, CellMark>();
  const verdict = state.verdict;
  if (verdict) {
    for (const index of verdict.correct_words) {
      const ref = model.words[index];
      if (ref && unchangedSince(state, ref.cells))
        ref.cells.forEach((k) => marks.set(k, 'correct'));
    }
    for (const index of verdict.wrong_words) {
      const ref = model.words[index];
      if (!ref || !unchangedSince(state, ref.cells)) continue;
      for (const key of ref.cells) if (marks.get(key) !== 'correct') marks.set(key, 'wrong');
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

/** [확인] 후 빨간색으로 표시할 칸: 글자를 넣었는데 서버가 틀리다고 한 칸 (그 뒤에 바꾼 칸은 빼요) */
export function wrongCells(_model: PuzzleModel, state: CrosswordState) {
  if (!state.checked || !state.verdict) return new Set<string>();
  return new Set(
    state.verdict.wrong_cells.filter(
      (key) => state.entries[key] && state.entries[key] === state.verdictEntries[key],
    ),
  );
}

/** 선택한 단어의 초성 힌트 (힌트 1단계 이상일 때) */
export function wordHint(model: PuzzleModel, state: CrosswordState) {
  const ref = currentWord(model, state);
  return (state.hintLevels[ref.index] ?? 0) >= 1 ? (state.hintTexts[ref.index] ?? null) : null;
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
        requestId: state.requestId + 1, // 서버에 채점을 부탁해요
        selected: next ? selectRef(next) : state.selected,
      };
    }
    case 'check':
      return { ...state, checked: true, message: null, requestId: state.requestId + 1 };
    case 'verdict': {
      if (action.requestId < state.verdictId) return state; // 늦게 도착한 옛 결과
      const same = Object.keys({ ...state.entries, ...action.entries }).every(
        (key) => (state.entries[key] ?? '') === (action.entries[key] ?? ''),
      );
      return {
        ...state,
        verdict: action.result,
        verdictEntries: action.entries,
        verdictId: action.requestId,
        // 채점한 칸에서 바뀐 게 없을 때만 "다 맞았다"로 봐요
        complete: state.complete || (action.result.complete && same),
      };
    }
    case 'hintResult': {
      if ((state.hintLevels[action.index] ?? 0) >= action.level) return state;
      const ref = model.words[action.index];
      if (!ref) return state;
      const entries =
        action.level === 2 && action.firstChar
          ? { ...state.entries, [ref.cells[0]]: action.firstChar }
          : state.entries;
      return {
        ...state,
        entries,
        hintLevels: { ...state.hintLevels, [action.index]: action.level },
        hintTexts: { ...state.hintTexts, [action.index]: action.choseong },
        hintsUsed: state.hintsUsed + 1,
        message: null,
        requestId: entries === state.entries ? state.requestId : state.requestId + 1,
      };
    }
    case 'revealResult': {
      const revealedKeys = [...model.cells.keys()].filter(
        (key) => state.entries[key] !== action.answers[key],
      );
      return {
        ...state,
        entries: { ...action.answers },
        revealed: true,
        revealedKeys,
        checked: false,
        message: null,
      };
    }
    case 'requestFailed':
      return { ...state, message: '서버에서 확인하지 못했어요. 잠시 후 다시 해 보세요' };
    case 'restart':
      return initialState(model);
    case 'clearMessage':
      return state.message ? { ...state, message: null } : state;
    default:
      return state;
  }
}
