import { useRef } from 'react';
import { Button } from '../../components/Button';
import type { CrosswordPuzzle } from '../../types';
import { ClueList } from './ClueList';
import { CrosswordGrid } from './CrosswordGrid';
import { formatClock } from './formatClock';
import { useCrossword } from './useCrossword';
import styles from './Crossword.module.css';

/**
 * 퍼즐 게임 화면
 * PC: 왼쪽 격자, 오른쪽 열쇠 / 휴대폰: 위 격자, 열쇠 목록은 접기
 * 다 풀거나 정답을 봐도 다른 화면으로 넘어가지 않고 격자에서 바로 보여줘요.
 */
export function CrosswordGame({ puzzle }: { puzzle: CrosswordPuzzle }) {
  const game = useCrossword(puzzle);
  const { model, state, dispatch, word, finished } = game;
  const inputRef = useRef<HTMLInputElement>(null);
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
            <Button
              variant="secondary"
              onClick={() => dispatch({ type: 'check' })}
              disabled={finished}
            >
              확인
            </Button>
            <Button
              variant="secondary"
              onClick={() => dispatch({ type: 'hint' })}
              disabled={finished || hintLevel >= 2}
            >
              {hintLevel === 0 ? '힌트' : hintLevel === 1 ? '한 글자 공개' : '힌트 다 씀'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => dispatch({ type: 'reveal' })}
              disabled={finished}
            >
              정답 보기
            </Button>
            <Button variant="ghost" onClick={game.restart}>
              다시 하기
            </Button>
          </div>
          {!finished && game.hint && (
            <p className={styles.toolNote} aria-live="polite">
              {word.word.direction === 'across' ? '가로' : '세로'} {word.word.number}번 힌트{' '}
              <strong className={styles.hintText}>{game.hint}</strong>
            </p>
          )}
          {!finished && state.checked && (
            <p className={styles.toolNote} role="status">
              {game.wrong.size === 0
                ? '지금까지 넣은 글자는 모두 맞아요'
                : `틀린 칸 ${game.wrong.size}개를 빨간색으로 표시했어요`}
            </p>
          )}
        </div>
      </div>

      <div className={styles.board}>
        {finished ? (
          <p className={styles.finished} role="status">
            <strong>{state.revealed ? '정답을 채웠어요' : '다 풀었어요!'}</strong>{' '}
            {state.revealed
              ? '초록은 내가 맞힌 칸, 파랑은 정답으로 채운 칸이에요.'
              : `${formatClock(game.elapsedMs)} 걸렸고 힌트는 ${state.hintsUsed}번 썼어요.`}
          </p>
        ) : (
          <p className={styles.currentClue}>
            <strong>
              {word.word.direction === 'across' ? '가로' : '세로'} {word.word.number}번
            </strong>{' '}
            {word.word.clue} <span className={styles.clueLength}>({word.cells.length}글자)</span>
            <span className={styles.message} aria-live="polite">
              {state.message}
            </span>
          </p>
        )}

        <CrosswordGrid
          ref={inputRef}
          model={model}
          state={state}
          word={word}
          marks={game.marks}
          finished={finished}
          dispatch={dispatch}
        />
        {!finished && (
          <p className={styles.gridTip}>
            칸을 누르고 바로 입력한 뒤 Enter · 맞으면 초록, 틀리면 빨강
          </p>
        )}
      </div>

      <aside className={styles.side} aria-label="열쇠 목록">
        <ClueList
          model={model}
          state={state}
          word={word}
          dispatch={dispatch}
          onPicked={() => inputRef.current?.focus()}
        />
      </aside>
      <details className={styles.mobileClues}>
        <summary>열쇠 목록 보기</summary>
        <ClueList
          model={model}
          state={state}
          word={word}
          dispatch={dispatch}
          onPicked={() => inputRef.current?.focus()}
        />
      </details>
    </div>
  );
}
