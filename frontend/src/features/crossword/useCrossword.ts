import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useCrosswordSave } from '../../hooks/useCrosswordSave';
import type { CrosswordPuzzle } from '../../types';
import {
  cellMarks,
  crosswordReducer,
  currentWord,
  initialState,
  isComplete,
  wordHint,
  wrongCells,
  type CrosswordAction,
} from './crosswordState';
import { buildPuzzleModel } from './puzzleModel';

/**
 * 퍼즐 한 판의 상태 + 타이머 + 저장(이어 풀기)을 묶은 훅.
 * 다 풀거나 정답을 봐도 다른 화면으로 넘어가지 않고 격자에서 바로 결과를 보여줘요.
 */
export function useCrossword(puzzle: CrosswordPuzzle) {
  const model = useMemo(() => buildPuzzleModel(puzzle), [puzzle]);
  const { saved, save, restart: restartSave } = useCrosswordSave(puzzle.id);

  const [state, dispatch] = useReducer(
    (s: ReturnType<typeof initialState>, a: CrosswordAction) => crosswordReducer(model, s, a),
    undefined,
    () =>
      initialState(model, {
        entries: saved.entries,
        hintLevels: saved.hint_levels,
        hintsUsed: saved.hints_used,
        revealed: saved.revealed,
        revealedKeys: saved.revealed_keys,
      }),
  );

  /** 다 맞혔거나 정답을 봤으면 이 판은 끝났어요. (시간이 멈추고 입력을 막아요) */
  const finished = state.revealed || isComplete(model, state.entries);

  // 타이머: 저장된 시간에서 이어서 세고, 끝나면 멈춰요.
  const base = useRef(saved.elapsed_ms);
  const resumedAt = useRef(Date.now());
  const [now, setNow] = useState(() => Date.now());
  const frozenMs = useRef<number | null>(finished ? saved.elapsed_ms : null);
  if (finished && frozenMs.current === null) {
    frozenMs.current = base.current + (Date.now() - resumedAt.current);
  }
  useEffect(() => {
    if (finished) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [finished]);
  const elapsedMs = frozenMs.current ?? base.current + (now - resumedAt.current);
  const elapsedRef = useRef(elapsedMs);
  elapsedRef.current = frozenMs.current ?? base.current + (Date.now() - resumedAt.current);

  // 입력이 바뀔 때마다 지금 판을 저장해요. (나갔다 와도 이어서 풀 수 있게)
  useEffect(() => {
    save({
      entries: state.entries,
      hint_levels: state.hintLevels,
      hints_used: state.hintsUsed,
      revealed: state.revealed,
      revealed_keys: state.revealedKeys,
      elapsed_ms: elapsedRef.current,
    });
  }, [
    state.entries,
    state.hintLevels,
    state.hintsUsed,
    state.revealed,
    state.revealedKeys,
    finished,
    save,
  ]);

  // 화면을 떠날 때 흐른 시간을 저장해요.
  useEffect(() => () => save({ elapsed_ms: elapsedRef.current }), [save]);

  const restart = useCallback(() => {
    restartSave();
    dispatch({ type: 'restart' });
    base.current = 0;
    resumedAt.current = Date.now();
    frozenMs.current = null;
    setNow(Date.now());
  }, [restartSave]);

  return {
    model,
    state,
    dispatch,
    word: currentWord(model, state),
    hint: wordHint(model, state),
    wrong: wrongCells(model, state),
    marks: cellMarks(model, state),
    elapsedMs,
    finished,
    restart,
  };
}

export type CrosswordGameState = ReturnType<typeof useCrossword>;
