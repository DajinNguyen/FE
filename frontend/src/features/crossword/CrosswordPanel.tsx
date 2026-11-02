import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { useCrosswordPuzzle, useCrosswordPuzzles } from '../../hooks/useCrosswords';
import { CrosswordGame } from './CrosswordGame';
import styles from './Crossword.module.css';

const difficultyLabel = { easy: '쉬움', normal: '보통' } as const;

interface CrosswordPanelProps {
  /** 고른 퍼즐 id. 없으면 첫 퍼즐로 시작해요. */
  puzzleId: string | null;
  onSelect: (puzzleId: string) => void;
}

/** 용어 카드 화면 안의 낱말퀴즈: 위쪽에서 퍼즐을 고르고, 바로 아래에서 풀어요. */
export function CrosswordPanel({ puzzleId, onSelect }: CrosswordPanelProps) {
  const list = useCrosswordPuzzles();
  const puzzles = list.data;
  const selectedId = puzzles?.some((p) => p.id === puzzleId) ? puzzleId! : puzzles?.[0]?.id;
  const detail = useCrosswordPuzzle(selectedId ?? '');
  const puzzle = detail.data;

  if (list.isError) {
    return (
      <ErrorState
        title="낱말퀴즈를 불러오지 못했어요"
        error={list.error}
        onRetry={() => list.refetch()}
      />
    );
  }
  if (puzzles && puzzles.length === 0) {
    return <EmptyState title="아직 풀 수 있는 낱말퀴즈가 없어요" />;
  }
  if (!puzzles || !selectedId) return <div className={styles.loading} aria-hidden="true" />;

  return (
    <div className={styles.panel}>
      <div className={styles.picker} role="group" aria-label="퍼즐 고르기">
        {puzzles.map((p) => (
          <button
            key={p.id}
            type="button"
            className={styles.pick}
            aria-pressed={p.id === selectedId}
            onClick={() => onSelect(p.id)}
          >
            {p.title}
            <span className={styles.pickMeta}>
              {difficultyLabel[p.difficulty]} · {p.size.rows}×{p.size.cols}
            </span>
          </button>
        ))}
      </div>
      {detail.isError ? (
        <ErrorState
          title="퍼즐을 불러오지 못했어요"
          error={detail.error}
          onRetry={() => detail.refetch()}
        />
      ) : puzzle && puzzle.id === selectedId ? (
        <CrosswordGame key={puzzle.id} puzzle={puzzle} />
      ) : (
        <div className={styles.loading} aria-hidden="true" />
      )}
    </div>
  );
}
