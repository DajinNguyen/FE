import { forwardRef, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Button } from '../../components/Button';
import type { CrosswordAction, CrosswordState } from './crosswordState';
import type { WordRef } from './puzzleModel';
import styles from './Crossword.module.css';

interface WordInputProps {
  word: WordRef;
  state: CrosswordState;
  dispatch: (action: CrosswordAction) => void;
}

/**
 * 고른 단어 전체를 한 번에 입력하고 Enter 로 칸에 채워요.
 * (한글 조합 입력이 칸마다 끊기지 않게) 조합 중 Enter 는 조합이 끝난 뒤 채워요.
 */
export const WordInput = forwardRef<HTMLInputElement, WordInputProps>(function WordInput(
  { word, state, dispatch },
  ref,
) {
  const [value, setValue] = useState('');
  const composing = useRef(false);
  const fillAfterComposition = useRef(false);

  const fill = (text: string) => {
    if (!text.trim()) return;
    dispatch({ type: 'fill', text });
    setValue('');
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (composing.current) {
      fillAfterComposition.current = true;
      return;
    }
    fill(value);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && (event.nativeEvent.isComposing || composing.current)) {
      event.preventDefault();
      fillAfterComposition.current = true;
    }
  };

  // 교차 칸에 이미 있는 글자는 미리 보여줘요. (빈 칸은 ○)
  const pattern = word.cells.map((key) => state.entries[key] ?? '○').join('');
  const directionText = word.word.direction === 'across' ? '가로' : '세로';

  return (
    <form className={styles.wordInput} onSubmit={onSubmit}>
      <div className={styles.inputRow}>
        <label htmlFor="crossword-input" className="visually-hidden">
          {directionText} {word.word.number}번 답 입력 ({word.cells.length}글자)
        </label>
        <input
          id="crossword-input"
          ref={ref}
          className={styles.input}
          value={value}
          placeholder={`${pattern}  입력 후 Enter`}
          onChange={(e) => setValue(e.target.value)}
          onCompositionStart={() => {
            composing.current = true;
          }}
          onCompositionEnd={(e) => {
            composing.current = false;
            if (fillAfterComposition.current) {
              fillAfterComposition.current = false;
              fill(e.currentTarget.value);
            }
          }}
          onKeyDown={onKeyDown}
          autoComplete="off"
          spellCheck={false}
        />
        <Button type="submit" disabled={!value.trim()}>
          채우기
        </Button>
      </div>
      {/* 글자 수가 다를 때만 안내해요. */}
      <p className={styles.message} aria-live="polite">
        {state.message}
      </p>
    </form>
  );
});
