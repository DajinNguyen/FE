import { Icon } from '../../components/Icon';
import { cellMarks, type CrosswordAction, type CrosswordState } from './crosswordState';
import { sortedWords, type PuzzleModel, type WordRef } from './puzzleModel';
import styles from './Crossword.module.css';

interface ClueListProps {
  model: PuzzleModel;
  state: CrosswordState;
  word: WordRef;
  dispatch: (action: CrosswordAction) => void;
  /** 열쇠를 고른 뒤 (바로 입력할 수 있게 입력창에 포커스) */
  onPicked?: () => void;
}

/** 가로·세로 열쇠 목록. 누르면 그 단어를 골라요. 맞힌 단어는 체크, 틀린 단어는 "틀림". */
export function ClueList({ model, state, word, dispatch, onPicked }: ClueListProps) {
  const marks = cellMarks(model, state);
  const judged = new Set(state.judged);
  return (
    <div className={styles.clues}>
      {(['across', 'down'] as const).map((direction) => (
        <section key={direction} aria-label={direction === 'across' ? '가로 열쇠' : '세로 열쇠'}>
          <h3 className={styles.clueTitle}>{direction === 'across' ? '가로 열쇠' : '세로 열쇠'}</h3>
          <ol className={styles.clueList}>
            {sortedWords(model, direction).map((ref) => {
              const result = !judged.has(ref.index)
                ? null
                : ref.cells.every((key) => marks.get(key) === 'correct')
                  ? 'correct'
                  : 'wrong';
              const active = ref.index === word.index;
              return (
                <li key={ref.index}>
                  <button
                    type="button"
                    className={`${styles.clue} ${active ? styles.clueActive : ''}`}
                    aria-current={active ? 'true' : undefined}
                    onClick={() => {
                      dispatch({ type: 'selectWord', index: ref.index });
                      onPicked?.();
                    }}
                  >
                    <span className={styles.clueNumber}>{ref.word.number}</span>
                    <span className={styles.clueText}>
                      {ref.word.clue}{' '}
                      <span className={styles.clueLength}>({ref.cells.length}글자)</span>
                    </span>
                    {result === 'correct' && (
                      <Icon name="check" size={16} className={styles.clueDone} aria-label="맞음" />
                    )}
                    {result === 'wrong' && <span className={styles.clueWrong}>틀림</span>}
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
