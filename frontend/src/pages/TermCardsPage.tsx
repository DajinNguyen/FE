import { useState } from 'react';
import { Button } from '../components/Button';
import { TermFlipCard } from '../features/term-cards/TermFlipCard';
import { useTermProgress, type TermMark } from '../hooks/useTermProgress';
import { useTerms } from '../hooks/useTerms';
import styles from './TermCardsPage.module.css';

export function TermCardsPage() {
  const { data: terms } = useTerms();
  const { mark, reset, knownCount, marks } = useTermProgress();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const total = terms?.length ?? 0;
  const finished = total > 0 && index >= total;
  const term = terms?.[index];

  const answer = (value: TermMark) => {
    if (!term) return;
    mark(term.id, value);
    setFlipped(false);
    setIndex((i) => i + 1);
  };

  const restart = (onlyUnknown: boolean) => {
    if (!terms) return;
    setFlipped(false);
    if (onlyUnknown) {
      const first = terms.findIndex((t) => marks[t.id] !== 'known');
      setIndex(first === -1 ? 0 : first);
    } else {
      setIndex(0);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>용어 카드</h1>
        <p className={styles.subtitle}>카드를 눌러 뒤집으면 쉬운 뜻이 나와요</p>
      </header>

      <div className={styles.progress}>
        <div className={styles.progressText}>
          <span>알고 있는 용어</span>
          <span>
            <strong>{knownCount}</strong> / {total}개
          </span>
        </div>
        <div
          className={styles.track}
          role="progressbar"
          aria-label="알고 있는 용어 비율"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={knownCount}
        >
          <div
            className={styles.bar}
            style={{ width: total ? `${(knownCount / total) * 100}%` : 0 }}
          />
        </div>
      </div>

      <div className={styles.layout}>
        <div className={styles.main}>
          {finished ? (
            <div className={styles.done}>
              <p className={styles.doneTitle}>카드를 모두 봤어요!</p>
              <p className={styles.doneText}>
                {total}개 중 {knownCount}개를 알고 있어요.
              </p>
              <div className={styles.actions}>
                <Button variant="secondary" size="lg" onClick={() => restart(false)}>
                  처음부터
                </Button>
                <Button size="lg" onClick={() => restart(true)} disabled={knownCount === total}>
                  모르는 것만
                </Button>
              </div>
              <button type="button" className={styles.reset} onClick={reset}>
                진행 상황 초기화
              </button>
            </div>
          ) : (
            term && (
              <>
                <p className={styles.counter}>
                  {index + 1} / {total}
                </p>
                <div key={term.id} className={styles.cardWrap}>
                  <TermFlipCard
                    term={term}
                    flipped={flipped}
                    onFlip={() => setFlipped((f) => !f)}
                  />
                </div>
                <div className={styles.actions}>
                  <Button variant="secondary" size="lg" onClick={() => answer('review')}>
                    다시 볼래요
                  </Button>
                  <Button size="lg" onClick={() => answer('known')}>
                    알았어요
                  </Button>
                </div>
              </>
            )
          )}
        </div>

        <aside className={styles.aside} aria-label="전체 용어">
          <h2 className={styles.asideTitle}>전체 용어</h2>
          <ul className={styles.termList}>
            {terms?.map((t, i) => (
              <li key={t.id}>
                <button
                  type="button"
                  className={`${styles.termChip} ${marks[t.id] ? styles[marks[t.id]] : ''} ${
                    i === index ? styles.current : ''
                  }`}
                  onClick={() => {
                    setFlipped(false);
                    setIndex(i);
                  }}
                  aria-current={i === index ? 'true' : undefined}
                >
                  {t.name}
                  <span className="visually-hidden">
                    {marks[t.id] === 'known'
                      ? ' (알아요)'
                      : marks[t.id] === 'review'
                        ? ' (다시 볼래요)'
                        : ''}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className={styles.legend}>
            <span className={`${styles.dot} ${styles.known}`} /> 알아요
            <span className={`${styles.dot} ${styles.review}`} /> 다시 볼래요
          </p>
          <p className={styles.notice}>로그인하면 외운 용어와 진행 상황이 저장돼요</p>
        </aside>
      </div>
    </div>
  );
}
