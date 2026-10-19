import { forwardRef, useRef, useState, type KeyboardEvent } from 'react';
import type { CellMark, CrosswordAction, CrosswordState } from './crosswordState';
import { clueOrder } from './crosswordState';
import type { PuzzleModel, WordRef } from './puzzleModel';
import styles from './Crossword.module.css';

interface CrosswordGridProps {
  model: PuzzleModel;
  state: CrosswordState;
  word: WordRef;
  /** 칸 색: 맞은 단어 초록, 틀린 단어 빨강, 정답 보기로 채운 칸 파랑 */
  marks: Map<string, CellMark>;
  /** 다 풀었거나 정답을 봤으면 입력을 막아요. */
  finished: boolean;
  dispatch: (action: CrosswordAction) => void;
}

const directionLabel = { across: '가로', down: '세로' } as const;

/** 칸 설명: "가로 3번, 2번째 칸, 세로 1번, 2번째 칸, 입력: 가" */
function cellLabel(
  model: PuzzleModel,
  key: string,
  entry: string | undefined,
  mark: CellMark | undefined,
) {
  const cell = model.cells.get(key)!;
  const parts = (['across', 'down'] as const)
    .filter((d) => cell[d] !== undefined)
    .map((d) => {
      const ref = model.words[cell[d]!];
      return `${directionLabel[d]} ${ref.word.number}번, ${ref.cells.indexOf(key) + 1}번째 칸`;
    });
  const markText = mark
    ? { correct: '맞음', wrong: '틀림', revealed: '정답 보기로 채움' }[mark]
    : null;
  return [...parts, entry ? `입력: ${entry}` : '비어 있음', markText].filter(Boolean).join(', ');
}

const toChars = (text: string) => [...text.replace(/\s+/g, '')];

/**
 * 격자. 칸을 누르면 그 칸의 단어를 고르고 바로 칸 위에서 입력해요.
 * 같은 칸을 다시 누르면 가로 ↔ 세로를 바꿔요.
 * 한글은 조합하면서 입력되니까, 단어 하나 위에 보이지 않는 입력창 하나를 겹쳐 두고
 * 치는 글자를 칸에 바로 보여줘요. 다 치고 Enter 를 누르면 채점해요.
 */
export const CrosswordGrid = forwardRef<HTMLInputElement, CrosswordGridProps>(
  function CrosswordGrid({ model, state, word, marks, finished, dispatch }, inputRef) {
    // 지금 단어에 치고 있는 글자 (단어가 바뀌면 비워요)
    const [draft, setDraft] = useState({ index: word.index, text: '' });
    const text = draft.index === word.index ? draft.text : '';
    const typed = toChars(text);
    const composing = useRef(false);
    const commitAfterComposition = useRef(false);

    const localRef = useRef<HTMLInputElement | null>(null);
    const setRefs = (el: HTMLInputElement | null) => {
      localRef.current = el;
      if (typeof inputRef === 'function') inputRef(el);
      else if (inputRef) inputRef.current = el;
    };

    const commit = (value: string) => {
      if (!value.trim()) return;
      dispatch({ type: 'fill', text: value });
      setDraft({ index: word.index, text: '' });
    };

    const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        if (event.nativeEvent.isComposing || composing.current) {
          commitAfterComposition.current = true;
          return;
        }
        commit(text);
        return;
      }
      if (event.key === 'Escape') {
        localRef.current?.blur();
        return;
      }
      if (event.key === 'Tab') {
        // 마지막(처음) 열쇠에서는 원래 Tab 동작으로 격자 밖으로 나가요.
        const order = clueOrder(model);
        const at = order.findIndex((ref) => ref.index === word.index);
        const step = event.shiftKey ? -1 : 1;
        if (at + step < 0 || at + step >= order.length) return;
        event.preventDefault();
        dispatch({ type: 'nextWord', step });
        return;
      }
      // 아직 아무것도 안 쳤을 때만 방향키로 칸을 옮겨요. (치는 중에는 글자 안에서 움직여요)
      const moves: Record<string, [number, number]> = {
        ArrowUp: [-1, 0],
        ArrowDown: [1, 0],
        ArrowLeft: [0, -1],
        ArrowRight: [0, 1],
      };
      const move = moves[event.key];
      if (move && !text) {
        event.preventDefault();
        dispatch({ type: 'move', dRow: move[0], dCol: move[1] });
      }
    };

    const wordCells = new Set(word.cells);
    // 다음 글자가 들어갈 칸
    const cursorKey = word.cells[Math.min(typed.length, word.cells.length - 1)];
    const { row, col } = word.word;
    const overlayArea =
      word.word.direction === 'across'
        ? { gridRow: `${row + 1}`, gridColumn: `${col + 1} / span ${word.cells.length}` }
        : { gridRow: `${row + 1} / span ${word.cells.length}`, gridColumn: `${col + 1}` };
    const dir = directionLabel[word.word.direction];

    return (
      <div
        className={styles.grid}
        style={{ gridTemplateColumns: `repeat(${model.cols}, minmax(0, 1fr))` }}
        role="group"
        aria-label={`${model.rows}×${model.cols} 낱말퀴즈 격자. 칸을 누르고 바로 입력한 뒤 Enter, 방향키로 칸 이동, Tab 으로 다음 열쇠`}
      >
        {Array.from({ length: model.rows * model.cols }, (_, i) => {
          const r = Math.floor(i / model.cols);
          const c = i % model.cols;
          const key = `${r},${c}`;
          const area = { gridRow: `${r + 1}`, gridColumn: `${c + 1}` };
          const cell = model.cells.get(key);
          if (!cell)
            return <div key={key} className={styles.block} style={area} aria-hidden="true" />;
          const position = word.cells.indexOf(key);
          // 치고 있는 단어는 친 글자를 먼저 보여줘요.
          const shown =
            position >= 0 && position < typed.length ? typed[position] : state.entries[key];
          const mark = marks.get(key);
          return (
            <button
              key={key}
              type="button"
              style={area}
              className={[
                styles.cell,
                !finished && wordCells.has(key) ? styles.inWord : '',
                !finished && key === cursorKey ? styles.cursorCell : '',
                mark === 'correct' ? styles.correctCell : '',
                mark === 'wrong' ? styles.wrongCell : '',
                mark === 'revealed' ? styles.revealedCell : '',
              ].join(' ')}
              tabIndex={-1}
              aria-label={cellLabel(model, key, state.entries[key], mark)}
              data-mark={mark}
              aria-pressed={state.selected.key === key}
              onClick={() => {
                if (finished) return;
                dispatch({ type: 'clickCell', key });
                // 칸을 누른 바로 그때 입력창에 포커스를 줘야 휴대폰 키보드가 떠요.
                localRef.current?.focus();
              }}
            >
              {cell.number !== undefined && (
                <span className={styles.number} aria-hidden="true">
                  {cell.number}
                </span>
              )}
              <span className={styles.letter} aria-hidden="true">
                {shown ?? ''}
              </span>
            </button>
          );
        })}

        <input
          ref={setRefs}
          className={styles.overlayInput}
          style={overlayArea}
          value={text}
          aria-label={`${dir} ${word.word.number}번 답 입력 (${word.cells.length}글자)`}
          onChange={(e) => {
            setDraft({ index: word.index, text: e.target.value });
            if (state.message) dispatch({ type: 'clearMessage' });
          }}
          onCompositionStart={() => {
            composing.current = true;
          }}
          onCompositionEnd={(e) => {
            composing.current = false;
            if (commitAfterComposition.current) {
              commitAfterComposition.current = false;
              commit(e.currentTarget.value);
            }
          }}
          onKeyDown={onKeyDown}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="done"
          disabled={finished}
        />
      </div>
    );
  },
);
