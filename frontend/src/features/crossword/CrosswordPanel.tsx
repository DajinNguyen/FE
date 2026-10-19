import { useCrosswordSaves } from '../../hooks/useCrosswordSave';
import { useCrosswordPuzzle, useCrosswordPuzzles } from '../../hooks/useCrosswords';
import { CrosswordGame } from './CrosswordGame';
import styles from './Crossword.module.css';

const difficultyLabel = { easy: '쉬움', normal: '보통' } as const;

interface CrosswordPanelProps {
  /** 고른 퍼즐 id. 없으면 아직 다 풀지 않은 첫 퍼즐로 시작해요. */
  puzzleId: string | null;
  onSelect: (puzzleId: string) => void;
}

/** 용어 카드 화면 안의 낱말퀴즈: 위쪽에서 퍼즐을 고르고, 바로 아래에서 풀어요. */
export function CrosswordPanel({ puzzleId, onSelect }: CrosswordPanelProps) {
  const { data: puzzles } = useCrosswordPuzzles();
  const saves = useCrosswordSaves();

  const fallback = puzzles?.find((p) => !saves[p.id]?.ever_completed) ?? puzzles?.[0];
  const selectedId = puzzles?.some((p) => p.id === puzzleId) ? puzzleId! : fallback?.id;
  const { data: puzzle } = useCrosswordPuzzle(selectedId ?? '');

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
              {saves[p.id]?.ever_completed ? ' · 완료' : ''}
            </span>
          </button>
        ))}
      </div>
      {puzzle && puzzle.id === selectedId ? (
        <CrosswordGame key={puzzle.id} puzzle={puzzle} />
      ) : (
        <div className={styles.loading} aria-hidden="true" />
      )}
    </div>
  );
}
