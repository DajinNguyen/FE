import { Link, useParams } from 'react-router';
import { EmptyState } from '../components/EmptyState';
import { Icon } from '../components/Icon';
import { CrosswordGame } from '../features/crossword/CrosswordGame';
import { useCrosswordPuzzle } from '../hooks/useCrosswords';
import styles from './CrosswordPages.module.css';

const difficultyLabel = { easy: '쉬움', normal: '보통' } as const;

export function CrosswordPage() {
  const { puzzleId = '' } = useParams();
  const { data: puzzle, isPending, isError } = useCrosswordPuzzle(puzzleId);

  return (
    <div className={styles.page}>
      <Link to="/learn/crossword" className={styles.back}>
        <Icon name="back" size={18} /> 퍼즐 목록
      </Link>
      {isPending && <div className={styles.loading} aria-hidden="true" />}
      {isError && (
        <EmptyState
          title="퍼즐을 찾지 못했어요"
          action={<Link to="/learn/crossword">퍼즐 목록으로</Link>}
        />
      )}
      {puzzle && (
        <>
          <header className={styles.header}>
            <h1 className={styles.title}>
              {puzzle.title}
              <span className={styles.badge}>{difficultyLabel[puzzle.difficulty]}</span>
            </h1>
          </header>
          <CrosswordGame key={puzzle.id} puzzle={puzzle} />
        </>
      )}
    </div>
  );
}
