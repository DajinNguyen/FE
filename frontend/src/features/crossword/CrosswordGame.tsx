import { useRef, useState } from 'react';
import { Button } from '../../components/Button';
import type { CrosswordPuzzle } from '../../types';
import { ClueList } from './ClueList';
import { CrosswordComplete } from './CrosswordComplete';
import { CrosswordGrid } from './CrosswordGrid';
import { formatClock } from './formatClock';
import { useCrossword } from './useCrossword';
import { WordInput } from './WordInput';
import styles from './Crossword.module.css';

/**
 * 퍼즐 게임 화면
 * PC: 왼쪽 격자·입력, 오른쪽 가로·세로 열쇠 / 휴대폰: 위 격자, 아래 현재 열쇠·입력, 열쇠 목록은 접기
 */
export function CrosswordGame({ puzzle }: { puzzle: CrosswordPuzzle }) {
  const game = useCrossword(puzzle);
  const { model, state, dispatch, word } = game;
  const inputRef = useRef<HTMLInputElement>(null);
  const [confirmReveal, setConfirmReveal] = useState(false);

  if (game.result) {
    return (
      <CrosswordComplete
        puzzle={puzzle}
        result={game.result}
        hintsUsed={state.hintsUsed}
        bestMs={game.bestMs}
        onRestart={game.restart}
      />
    );
  }

  const hintLevel = state.hintLevels[word.index] ?? 0;

  return (
    <div className={styles.game}>
      {/* 위쪽: 왼쪽 시간·힌트 수, 오른쪽 풀이 도구와 그 결과 안내 */}
      <div className={styles.topBar}>
        <div className={styles.status}>
          <span>
            시간 <strong>{formatClock(game.elapsedMs)}</strong>
          </span>
          <span>
            힌트 <strong>{state.hintsUsed}번</strong>
          </span>
        </div>
        <div className={styles.tools}>
          <div className={styles.toolbar}>
            <Button variant="secondary" onClick={() => dispatch({ type: 'check' })}>
              확인
            </Button>
            <Button
              variant="secondary"
              onClick={() => dispatch({ type: 'hint' })}
              disabled={hintLevel >= 2}
            >
              {hintLevel === 0 ? '힌트' : hintLevel === 1 ? '한 글자 공개' : '힌트 다 씀'}
            </Button>
            <Button variant="secondary" onClick={() => setConfirmReveal(true)}>
              정답 보기
            </Button>
            <Button variant="ghost" onClick={game.restart}>
              다시 하기
            </Button>
          </div>
          {game.hint && (
            <p className={styles.toolNote} aria-live="polite">
              {word.word.direction === 'across' ? '가로' : '세로'} {word.word.number}번 힌트{' '}
              <strong className={styles.hintText}>{game.hint}</strong>
            </p>
          )}
          {state.checked && (
            <p className={styles.toolNote} role="status">
              {game.wrong.size === 0
                ? '지금까지 넣은 글자는 모두 맞아요'
                : `틀린 칸 ${game.wrong.size}개를 빨간색으로 표시했어요`}
            </p>
          )}
          {confirmReveal && (
            <div className={styles.confirm} role="alertdialog" aria-labelledby="reveal-title">
              <p id="reveal-title">
                정답을 모두 보여줄까요? 이번 판은 기록에 <strong>"정답 확인함"</strong>으로 남아요.
              </p>
              <div className={styles.confirmActions}>
                <Button
                  onClick={() => {
                    setConfirmReveal(false);
                    dispatch({ type: 'reveal' });
                  }}
                  autoFocus
                >
                  정답 보기
                </Button>
                <Button variant="secondary" onClick={() => setConfirmReveal(false)}>
                  취소
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.board}>
        <p className={styles.currentClue}>
          <strong>
            {word.word.direction === 'across' ? '가로' : '세로'} {word.word.number}번
          </strong>{' '}
          {word.word.clue} <span className={styles.clueLength}>({word.cells.length}글자)</span>
        </p>

        <CrosswordGrid
          model={model}
          state={state}
          word={word}
          wrong={game.wrong}
          dispatch={dispatch}
          onEnter={() => inputRef.current?.focus()}
        />

        {/* 아래쪽에는 정답 입력만 */}
        <WordInput key={word.index} ref={inputRef} word={word} state={state} dispatch={dispatch} />
      </div>

      <aside className={styles.side} aria-label="열쇠 목록">
        <ClueList model={model} state={state} word={word} dispatch={dispatch} />
      </aside>
      <details className={styles.mobileClues}>
        <summary>열쇠 목록 보기</summary>
        <ClueList model={model} state={state} word={word} dispatch={dispatch} />
      </details>
    </div>
  );
}
