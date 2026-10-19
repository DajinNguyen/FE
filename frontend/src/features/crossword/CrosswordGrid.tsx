import { useEffect, useRef, type KeyboardEvent } from 'react';
import type { CrosswordAction, CrosswordState } from './crosswordState';
import { clueOrder } from './crosswordState';
import type { PuzzleModel, WordRef } from './puzzleModel';
import styles from './Crossword.module.css';

interface CrosswordGridProps {
  model: PuzzleModel;
  state: CrosswordState;
  word: WordRef;
  wrong: Set<string>;
  dispatch: (action: CrosswordAction) => void;
  /** 칸에서 Enter 를 누르면 입력창으로 */
  onEnter: () => void;
}

const directionLabel = { across: '가로', down: '세로' } as const;

/** 칸 설명: "가로 3번, 2번째 칸, 세로 1번, 2번째 칸, 입력: 가" */
function cellLabel(model: PuzzleModel, key: string, entry: string | undefined) {
  const cell = model.cells.get(key)!;
  const parts = (['across', 'down'] as const)
    .filter((d) => cell[d] !== undefined)
    .map((d) => {
      const ref = model.words[cell[d]!];
      return `${directionLabel[d]} ${ref.word.number}번, ${ref.cells.indexOf(key) + 1}번째 칸`;
    });
  return [...parts, entry ? `입력: ${entry}` : '비어 있음'].join(', ');
}

/** 격자. 칸을 누르면 그 칸의 단어를 고르고, 같은 칸을 다시 누르면 가로 ↔ 세로를 바꿔요. */
export function CrosswordGrid({
  model,
  state,
  word,
  wrong,
  dispatch,
  onEnter,
}: CrosswordGridProps) {
  const cellRefs = useRef(new Map<string, HTMLButtonElement>());
  const keyboardMoved = useRef(false);

  // 키보드로 옮겼을 때만 새 칸으로 포커스를 옮겨요. (클릭은 그대로)
  useEffect(() => {
    if (!keyboardMoved.current) return;
    keyboardMoved.current = false;
    cellRefs.current.get(state.selected.key)?.focus();
  }, [state.selected.key]);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const moves: Record<string, [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };
    const move = moves[event.key];
    if (move) {
      event.preventDefault();
      keyboardMoved.current = true;
      dispatch({ type: 'move', dRow: move[0], dCol: move[1] });
      return;
    }
    if (event.key === 'Tab') {
      // 마지막(처음) 열쇠에서는 원래 Tab 동작으로 격자 밖으로 나가요.
      const order = clueOrder(model);
      const at = order.findIndex((ref) => ref.index === word.index);
      const step = event.shiftKey ? -1 : 1;
      if (at + step < 0 || at + step >= order.length) return;
      event.preventDefault();
      keyboardMoved.current = true;
      dispatch({ type: 'nextWord', step });
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      onEnter();
    }
  };

  const wordCells = new Set(word.cells);

  return (
    <div
      className={styles.grid}
      style={{ gridTemplateColumns: `repeat(${model.cols}, minmax(0, 1fr))` }}
      role="group"
      aria-label={`${model.rows}×${model.cols} 낱말퀴즈 격자. 방향키로 칸 이동, Tab 으로 다음 열쇠, Enter 로 입력`}
    >
      {Array.from({ length: model.rows * model.cols }, (_, i) => {
        const row = Math.floor(i / model.cols);
        const col = i % model.cols;
        const key = `${row},${col}`;
        const cell = model.cells.get(key);
        if (!cell) return <div key={key} className={styles.block} aria-hidden="true" />;
        const entry = state.entries[key];
        const selected = state.selected.key === key;
        return (
          <button
            key={key}
            ref={(el) => {
              if (el) cellRefs.current.set(key, el);
              else cellRefs.current.delete(key);
            }}
            type="button"
            className={[
              styles.cell,
              wordCells.has(key) ? styles.inWord : '',
              selected ? styles.selectedCell : '',
              wrong.has(key) ? styles.wrongCell : '',
            ].join(' ')}
            tabIndex={selected ? 0 : -1}
            aria-label={cellLabel(model, key, entry)}
            aria-pressed={selected}
            onClick={() => dispatch({ type: 'clickCell', key })}
            onKeyDown={onKeyDown}
          >
            {cell.number !== undefined && (
              <span className={styles.number} aria-hidden="true">
                {cell.number}
              </span>
            )}
            <span className={styles.letter} aria-hidden="true">
              {entry ?? ''}
            </span>
          </button>
        );
      })}
    </div>
  );
}
