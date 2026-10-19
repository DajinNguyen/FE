import { Link } from 'react-router';
import { Icon } from '../components/Icon';
import { formatClock } from '../features/crossword/formatClock';
import { useCrosswordSaves } from '../hooks/useCrosswordSave';
import { useCrosswordPuzzles } from '../hooks/useCrosswords';
import styles from './CrosswordPages.module.css';

const difficultyLabel = { easy: '쉬움', normal: '보통' } as const;

/** 가로세로 낱말퀴즈 목록: 제목, 난이도, 완료 여부, 최고 기록 */
export function CrosswordListPage() {
  const { data: puzzles, isPending, isError } = useCrosswordPuzzles();
  const saves = useCrosswordSaves();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>가로세로 낱말퀴즈</h1>
        <p className={styles.subtitle}>열쇠를 보고 주식·재무 용어를 칸에 채워요</p>
      </header>

      {isError && <p className={styles.hint}>퍼즐을 불러오지 못했어요.</p>}
      {isPending && <div className={styles.loading} aria-hidden="true" />}

      <ul className={styles.list} aria-label="퍼즐 목록">
        {puzzles?.map((puzzle) => {
          const save = saves[puzzle.id];
          const inProgress = save && !save.completed && Object.keys(save.entries).length > 0;
          const status = save?.ever_completed ? '완료' : inProgress ? '푸는 중' : '시작 전';
          return (
            <li key={puzzle.id}>
              <Link to={`/learn/crossword/${puzzle.id}`} className={styles.row}>
                <span className={styles.main}>
                  <span className={styles.name}>
                    {puzzle.title}
                    <span className={styles.badge}>{difficultyLabel[puzzle.difficulty]}</span>
                  </span>
                  <span className={styles.meta}>
                    {puzzle.size.rows}×{puzzle.size.cols} · {puzzle.word_count}단어 · {status}
                    {save?.best_ms != null && ` · 최고 기록 ${formatClock(save.best_ms)}`}
                  </span>
                </span>
                <Icon name="chevronRight" size={20} className={styles.chevron} />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
