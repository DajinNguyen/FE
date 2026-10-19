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
 * 상태 계산은 crosswordState.ts, 저장은 useCrosswordSave 가 맡아요.
 */
export function useCrossword(puzzle: CrosswordPuzzle) {
  const model = useMemo(() => buildPuzzleModel(puzzle), [puzzle]);
  const { saved, save, complete, restart: restartSave } = useCrosswordSave(puzzle.id);

  const [state, dispatch] = useReducer(
    (s: ReturnType<typeof initialState>, a: CrosswordAction) => crosswordReducer(model, s, a),
    undefined,
    () =>
      initialState(model, {
        entries: saved.entries,
        hintLevels: saved.hint_levels,
        hintsUsed: saved.hints_used,
        revealed: saved.revealed,
      }),
  );

  // 다 푼 판이면 완료 화면부터 보여줘요.
  const [result, setResult] = useState<{ ms: number; revealed: boolean; isBest: boolean } | null>(
    () =>
      saved.completed ? { ms: saved.elapsed_ms, revealed: saved.revealed, isBest: false } : null,
  );

  /** 이 판을 다 풀었는지 (떠날 때 시간 저장 여부를 정해요) */
  const crosswordDone = useRef(Boolean(result));

  // 타이머: 저장된 시간에서 이어서 세요.
  const base = useRef(saved.completed ? 0 : saved.elapsed_ms);
  const resumedAt = useRef(Date.now());
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (result) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [result]);
  const elapsedMs = result ? result.ms : base.current + (now - resumedAt.current);
  const elapsedRef = useRef(elapsedMs);
  elapsedRef.current = result ? result.ms : base.current + (Date.now() - resumedAt.current);

  // 입력이 바뀔 때마다 저장해요. (나갔다 와도 이어서 풀 수 있게)
  useEffect(() => {
    if (result) return;
    save({
      entries: state.entries,
      hint_levels: state.hintLevels,
      hints_used: state.hintsUsed,
      revealed: state.revealed,
      elapsed_ms: elapsedRef.current,
    });
  }, [state.entries, state.hintLevels, state.hintsUsed, state.revealed, result, save]);

  // 화면을 떠날 때 흐른 시간을 저장해요.
  useEffect(
    () => () => {
      if (!crosswordDone.current) save({ elapsed_ms: elapsedRef.current });
    },
    [save],
  );

  // 다 맞히면 완료
  useEffect(() => {
    if (result || !isComplete(model, state.entries)) return;
    const ms = elapsedRef.current;
    crosswordDone.current = true;
    setResult({ ms, revealed: state.revealed, isBest: complete(ms, state.revealed) });
  }, [model, state.entries, state.revealed, result, complete]);

  const restart = useCallback(() => {
    restartSave();
    dispatch({ type: 'restart' });
    base.current = 0;
    resumedAt.current = Date.now();
    crosswordDone.current = false;
    setNow(Date.now());
    setResult(null);
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
    result,
    bestMs: saved.best_ms,
    restart,
  };
}

export type CrosswordGameState = ReturnType<typeof useCrossword>;
