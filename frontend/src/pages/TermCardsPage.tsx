import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Button } from '../components/Button';
import { SegmentedControl } from '../components/SegmentedControl';
import {
  termCategories,
  termCategoryLabels,
  type TermCategoryFilter,
} from '../features/term-cards/termCategories';
import { TermFlipCard } from '../features/term-cards/TermFlipCard';
import { TermGame } from '../features/term-game/TermGame';
import { useTermProgress, type TermMark } from '../hooks/useTermProgress';
import { useTerms } from '../hooks/useTerms';
import styles from './TermCardsPage.module.css';

type PageMode = 'cards' | 'game';

const modeOptions = [
  { value: 'cards', label: '카드 학습' },
  { value: 'game', label: '게임' },
] as const;

/** 게임은 분류 안에 용어가 이만큼은 있어야 보기 4개를 만들 수 있어요. */
const MIN_GAME_TERMS = 4;

export function TermCardsPage() {
  const { data: allTerms } = useTerms();
  const { mark, reset, marks } = useTermProgress();
  const [searchParams, setSearchParams] = useSearchParams();
  const mode: PageMode = searchParams.get('mode') === 'game' ? 'game' : 'cards';
  const [category, setCategory] = useState<TermCategoryFilter>('all');
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const terms = useMemo(
    () => (allTerms ?? []).filter((t) => category === 'all' || t.category === category),
    [allTerms, category],
  );

  const total = terms.length;
  const knownCount = terms.filter((t) => marks[t.id] === 'known').length;
  const finished = total > 0 && index >= total;
  const term = terms[index];

  const changeMode = (next: PageMode) => {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        if (next === 'game') params.set('mode', 'game');
        else params.delete('mode');
        return params;
      },
      { replace: true },
    );
  };

  const changeCategory = (next: TermCategoryFilter) => {
    setCategory(next);
    setIndex(0);
    setFlipped(false);
  };

  const answer = (value: TermMark) => {
    if (!term) return;
    mark(term.id, value);
    setFlipped(false);
    setIndex((i) => i + 1);
  };

  const restart = (onlyUnknown: boolean) => {
    setFlipped(false);
    if (onlyUnknown) {
      const first = terms.findIndex((t) => marks[t.id] !== 'known');
      setIndex(first === -1 ? 0 : first);
    } else {
      setIndex(0);
    }
  };

  const categoryCount = (value: TermCategoryFilter) =>
    (allTerms ?? []).filter((t) => value === 'all' || t.category === value).length;

  const gameTerms = terms.length >= MIN_GAME_TERMS ? terms : (allTerms ?? []);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>용어 카드</h1>
          <p className={styles.subtitle}>
            {mode === 'game'
              ? '문제를 풀면서 용어를 익혀요'
              : '카드를 눌러 뒤집으면 쉬운 뜻이 나와요'}
          </p>
        </div>
        <SegmentedControl
          label="학습 방법"
          options={modeOptions}
          value={mode}
          onChange={changeMode}
        />
      </header>

      <div className={styles.filters} role="group" aria-label="용어 분류">
        {(['all', ...termCategories] as TermCategoryFilter[]).map((value) => (
          <button
            key={value}
            type="button"
            className={styles.filterChip}
            aria-pressed={category === value}
            onClick={() => changeCategory(value)}
          >
            {value === 'all' ? '전체' : termCategoryLabels[value]}
            <span className={styles.filterCount}>{categoryCount(value)}</span>
          </button>
        ))}
      </div>

      {mode === 'game' ? (
        <div className={styles.gameWrap}>
          {allTerms && allTerms.length >= MIN_GAME_TERMS && (
            <TermGame
              key={category}
              terms={gameTerms}
              allTerms={allTerms}
              categoryLabel={
                category !== 'all' && gameTerms === terms ? termCategoryLabels[category] : undefined
              }
            />
          )}
        </div>
      ) : (
        <>
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
                  <Button
                    block
                    size="lg"
                    className={styles.toGame}
                    onClick={() => changeMode('game')}
                  >
                    게임으로 확인해 보기
                  </Button>
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

            <aside className={styles.aside} aria-label="용어 목록">
              <h2 className={styles.asideTitle}>
                {category === 'all' ? '전체 용어' : `${termCategoryLabels[category]} 용어`}
              </h2>
              <ul className={styles.termList}>
                {terms.map((t, i) => (
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
                      {t.term}
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
        </>
      )}
    </div>
  );
}
