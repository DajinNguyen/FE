import { Icon } from '../../components/Icon';
import type { CrosswordAction, CrosswordState } from './crosswordState';
import { sortedWords, type PuzzleModel, type WordRef } from './puzzleModel';
import styles from './Crossword.module.css';

interface ClueListProps {
  model: PuzzleModel;
  state: CrosswordState;
  word: WordRef;
  dispatch: (action: CrosswordAction) => void;
}

/** 가로·세로 열쇠 목록. 누르면 그 단어를 골라요. 다 채운 단어는 체크 표시. */
export function ClueList({ model, state, word, dispatch }: ClueListProps) {
  return (
    <div className={styles.clues}>
      {(['across', 'down'] as const).map((direction) => (
        <section key={direction} aria-label={direction === 'across' ? '가로 열쇠' : '세로 열쇠'}>
          <h3 className={styles.clueTitle}>{direction === 'across' ? '가로 열쇠' : '세로 열쇠'}</h3>
          <ol className={styles.clueList}>
            {sortedWords(model, direction).map((ref) => {
              const filled = ref.cells.every((key) => state.entries[key]);
              const active = ref.index === word.index;
              return (
                <li key={ref.index}>
                  <button
                    type="button"
                    className={`${styles.clue} ${active ? styles.clueActive : ''}`}
                    aria-current={active ? 'true' : undefined}
                    onClick={() => dispatch({ type: 'selectWord', index: ref.index })}
                  >
                    <span className={styles.clueNumber}>{ref.word.number}</span>
                    <span className={styles.clueText}>
                      {ref.word.clue}{' '}
                      <span className={styles.clueLength}>({ref.cells.length}글자)</span>
                    </span>
                    {filled && <Icon name="check" size={16} className={styles.clueDone} />}
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
