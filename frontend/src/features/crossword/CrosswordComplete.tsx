import { Link } from 'react-router';
import { Button } from '../../components/Button';
import { useTermSheet } from '../../hooks/useTermSheet';
import type { CrosswordPuzzle } from '../../types';
import { formatClock } from './formatClock';
import styles from './Crossword.module.css';

interface CrosswordCompleteProps {
  puzzle: CrosswordPuzzle;
  result: { ms: number; revealed: boolean; isBest: boolean };
  hintsUsed: number;
  bestMs: number | null;
  onRestart: () => void;
}

/** 완료 화면: 걸린 시간, 힌트 수, 이 퍼즐에 나온 용어(누르면 설명) */
export function CrosswordComplete({
  puzzle,
  result,
  hintsUsed,
  bestMs,
  onRestart,
}: CrosswordCompleteProps) {
  const { openTerm } = useTermSheet();
  const words = [...puzzle.words].sort((a, b) => a.answer.localeCompare(b.answer, 'ko'));

  return (
    <section className={styles.complete} aria-labelledby="crossword-complete">
      <h2 id="crossword-complete" className={styles.completeTitle}>
        {result.revealed
          ? '정답을 확인했어요'
          : result.isBest
            ? '최고 기록이에요!'
            : '다 풀었어요!'}
      </h2>
      <dl className={styles.stats}>
        <div>
          <dt>걸린 시간</dt>
          <dd>{formatClock(result.ms)}</dd>
        </div>
        <div>
          <dt>힌트</dt>
          <dd>{hintsUsed}번</dd>
        </div>
        <div>
          <dt>최고 기록</dt>
          <dd>{bestMs !== null ? formatClock(bestMs) : '아직 없어요'}</dd>
        </div>
      </dl>
      {result.revealed && (
        <p className={styles.revealedNote}>
          정답 보기를 써서 이번 판은 기록에 "정답 확인함"으로 남아요.
        </p>
      )}

      <h3 className={styles.clueTitle}>이 퍼즐에 나온 용어</h3>
      <ul className={styles.termList}>
        {words.map((word) => (
          <li key={`${word.direction}-${word.number}`}>
            <button
              type="button"
              className={styles.termButton}
              onClick={() => openTerm(word.term_id)}
            >
              <strong>{word.answer}</strong>
              <span>{word.clue}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className={styles.completeActions}>
        <Button size="lg" onClick={onRestart}>
          다시 하기
        </Button>
        <Link to="/terms" className={styles.textLink}>
          카드 학습으로 복습하기
        </Link>
      </div>
    </section>
  );
}
