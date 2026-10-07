import type { Term } from '../../types';
import { termCategoryLabels, termLevelLabels } from './termCategories';
import styles from './TermFlipCard.module.css';

interface TermFlipCardProps {
  term: Term;
  flipped: boolean;
  onFlip: () => void;
}

/** 누르면 뒤집혀서 쉬운 뜻과 예시가 나오는 카드 */
export function TermFlipCard({ term, flipped, onFlip }: TermFlipCardProps) {
  return (
    <button
      type="button"
      className={`${styles.card} ${flipped ? styles.flipped : ''}`}
      onClick={onFlip}
      aria-pressed={flipped}
      aria-label={
        flipped
          ? `${term.term} 뜻: ${term.easy}`
          : `${term.term}, ${termLevelLabels[term.level]}, 눌러서 뜻 보기`
      }
    >
      <span className={styles.inner}>
        <span className={`${styles.face} ${styles.front}`} aria-hidden={flipped}>
          <span className={styles.badges}>
            <span className={styles.badge}>{termCategoryLabels[term.category]}</span>
            <span className={styles.badge}>{termLevelLabels[term.level]}</span>
          </span>
          <span className={styles.frontName}>{term.term}</span>
          <span className={styles.hint}>눌러서 뜻 보기</span>
        </span>
        <span className={`${styles.face} ${styles.back}`} aria-hidden={!flipped}>
          <span className={styles.backName}>{term.term}</span>
          <span className={styles.meaning}>{term.easy}</span>
          <span className={styles.example}>
            <span className={styles.exampleLabel}>예를 들면</span>
            {term.example}
          </span>
        </span>
      </span>
    </button>
  );
}
