import type { Term } from '../../types';
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
        flipped ? `${term.name} 뜻: ${term.easy_meaning}` : `${term.name}, 눌러서 뜻 보기`
      }
    >
      <span className={styles.inner}>
        <span className={`${styles.face} ${styles.front}`} aria-hidden={flipped}>
          <span className={styles.frontName}>{term.name}</span>
          <span className={styles.hint}>눌러서 뜻 보기</span>
        </span>
        <span className={`${styles.face} ${styles.back}`} aria-hidden={!flipped}>
          <span className={styles.backName}>{term.name}</span>
          <span className={styles.meaning}>{term.easy_meaning}</span>
          <span className={styles.example}>
            <span className={styles.exampleLabel}>예를 들면</span>
            {term.example}
          </span>
        </span>
      </span>
    </button>
  );
}
