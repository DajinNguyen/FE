import { useState } from 'react';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { SegmentedControl } from '../../components/SegmentedControl';
import { useTermGameRecord } from '../../hooks/useTermGameRecord';
import type { Term } from '../../types';
import { termCategoryLabels } from '../term-cards/termCategories';
import {
  buildQuestions,
  GAME_ROUND_SIZE,
  type GameMode,
  type GameQuestion,
} from './buildQuestions';
import styles from './TermGame.module.css';

const modeOptions = [
  { value: 'mixed', label: '섞어서' },
  { value: 'meaning', label: '뜻 맞히기' },
  { value: 'term', label: '용어 맞히기' },
  { value: 'ox', label: 'OX' },
] as const;

const questionTitle: Record<GameQuestion['type'], string> = {
  meaning: '이 용어의 뜻은 무엇일까요?',
  term: '이 뜻에 맞는 용어는 무엇일까요?',
  ox: '용어와 뜻이 맞게 짝지어졌을까요?',
};

interface TermGameProps {
  /** 문제로 낼 용어 (분류 필터 적용) */
  terms: Term[];
  /** 오답 보기를 뽑을 전체 용어 */
  allTerms: Term[];
  /** 지금 고른 분류 이름 (전체면 undefined) */
  categoryLabel?: string;
}

interface Answer {
  question: GameQuestion;
  correct: boolean;
}

const resultMessage = (score: number, total: number) => {
  if (score === total) return '모두 맞혔어요! 용어 박사네요.';
  if (score >= total * 0.7) return '잘했어요! 틀린 용어만 한 번 더 볼까요?';
  if (score >= total * 0.4) return '좋아요. 틀린 용어를 다시 보면 금방 늘어요.';
  return '처음엔 다 어려워요. 카드 학습으로 먼저 익혀 봐요.';
};

/** 용어 게임: 뜻 맞히기 / 용어 맞히기 / OX, 한 판 10문제 */
export function TermGame({ terms, allTerms, categoryLabel }: TermGameProps) {
  const { record, saveRound } = useTermGameRecord();
  const [mode, setMode] = useState<GameMode>('mixed');
  const [questions, setQuestions] = useState<GameQuestion[] | null>(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [finished, setFinished] = useState(false);

  const start = (targets: Term[]) => {
    setQuestions(buildQuestions({ targets, allTerms, mode }));
    setIndex(0);
    setSelected(null);
    setAnswers([]);
    setStreak(0);
    setBestStreak(0);
    setFinished(false);
  };

  const backToSetup = () => {
    setQuestions(null);
    setFinished(false);
  };

  if (!questions) {
    const savedWrong = allTerms.filter((t) => record.wrong_term_ids.includes(t.id));
    return (
      <div className={styles.card}>
        <p className={styles.eyebrow}>
          <Icon name="sparkle" size={16} /> 용어 게임
        </p>
        <h2 className={styles.setupTitle}>
          {Math.min(GAME_ROUND_SIZE, terms.length)}문제를 풀어 봐요
        </h2>
        <p className={styles.setupText}>
          {categoryLabel
            ? `'${categoryLabel}' 분류에서 문제가 나와요.`
            : '모든 분류에서 문제가 나와요.'}
        </p>
        <div className={styles.modePicker}>
          <SegmentedControl
            label="게임 종류"
            options={modeOptions}
            value={mode}
            onChange={setMode}
          />
        </div>
        {record.plays > 0 && (
          <dl className={styles.recordRow}>
            <div>
              <dt>최고 점수</dt>
              <dd>
                {record.best_score} / {GAME_ROUND_SIZE}
              </dd>
            </div>
            <div>
              <dt>최고 연속 정답</dt>
              <dd>{record.best_streak}개</dd>
            </div>
            <div>
              <dt>플레이</dt>
              <dd>{record.plays}판</dd>
            </div>
          </dl>
        )}
        <Button size="lg" block onClick={() => start(terms)} className={styles.startButton}>
          게임 시작
        </Button>
        {savedWrong.length > 0 && (
          <Button variant="secondary" size="lg" block onClick={() => start(savedWrong)}>
            지난번에 틀린 용어 {savedWrong.length}개 다시 풀기
          </Button>
        )}
      </div>
    );
  }

  const score = answers.filter((a) => a.correct).length;

  if (finished) {
    const wrongTerms = answers.filter((a) => !a.correct).map((a) => a.question.term);
    return (
      <div className={styles.card}>
        <p className={styles.eyebrow}>결과</p>
        <p className={styles.score}>
          {questions.length}문제 중 <strong>{score}문제</strong> 맞혔어요
        </p>
        <p className={styles.resultMessage}>{resultMessage(score, questions.length)}</p>
        <p className={styles.bestStreak}>최고 연속 정답 {bestStreak}개</p>
        {wrongTerms.length > 0 && (
          <section className={styles.wrongSection} aria-label="틀린 용어">
            <h3 className={styles.wrongTitle}>틀린 용어 다시 보기</h3>
            <ul className={styles.wrongList}>
              {wrongTerms.map((t) => (
                <li key={t.id} className={styles.wrongItem}>
                  <p className={styles.wrongTerm}>{t.term}</p>
                  <p className={styles.wrongMeaning}>{t.easy}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
        <div className={styles.actions}>
          {wrongTerms.length > 0 && (
            <Button size="lg" onClick={() => start(wrongTerms)}>
              틀린 용어만 다시
            </Button>
          )}
          <Button
            variant={wrongTerms.length > 0 ? 'secondary' : 'primary'}
            size="lg"
            onClick={() => start(terms)}
          >
            다시 하기
          </Button>
        </div>
        <button type="button" className={styles.link} onClick={backToSetup}>
          게임 종류 바꾸기
        </button>
      </div>
    );
  }

  const question = questions[index];
  const answered = selected !== null;
  const isCorrect = selected === question.answerIndex;
  const isLast = index === questions.length - 1;

  const choose = (optionIndex: number) => {
    if (answered) return;
    const correct = optionIndex === question.answerIndex;
    setSelected(optionIndex);
    setAnswers((prev) => [...prev, { question, correct }]);
    const nextStreak = correct ? streak + 1 : 0;
    setStreak(nextStreak);
    setBestStreak((best) => Math.max(best, nextStreak));
  };

  const next = () => {
    if (isLast) {
      const correctIds = answers.filter((a) => a.correct).map((a) => a.question.term.id);
      const wrongIds = answers.filter((a) => !a.correct).map((a) => a.question.term.id);
      saveRound({ score: correctIds.length, bestStreak, correctIds, wrongIds });
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
  };

  return (
    <div className={styles.card} key={question.id}>
      <div className={styles.topRow}>
        <p className={styles.progress}>
          문제 {index + 1} / {questions.length}
        </p>
        <p className={styles.streak} aria-live="polite">
          {streak >= 2 ? `${streak}연속 정답!` : `점수 ${score}`}
        </p>
      </div>
      <div
        className={styles.track}
        role="progressbar"
        aria-label="게임 진행"
        aria-valuemin={0}
        aria-valuemax={questions.length}
        aria-valuenow={index + (answered ? 1 : 0)}
      >
        <div
          className={styles.bar}
          style={{ width: `${((index + (answered ? 1 : 0)) / questions.length) * 100}%` }}
        />
      </div>

      <p className={styles.questionTitle}>{questionTitle[question.type]}</p>
      <div className={styles.prompt}>
        <span className={styles.category}>{termCategoryLabels[question.term.category]}</span>
        {question.type === 'term' ? (
          <p className={styles.promptMeaning}>{question.term.easy}</p>
        ) : (
          <p className={styles.promptTerm}>{question.term.term}</p>
        )}
        {question.type === 'ox' && <p className={styles.promptMeaning}>{question.statement}</p>}
      </div>

      <ul className={question.type === 'ox' ? styles.oxOptions : styles.options}>
        {question.options.map((option, optionIndex) => {
          const state = !answered
            ? ''
            : optionIndex === question.answerIndex
              ? styles.correct
              : optionIndex === selected
                ? styles.wrong
                : styles.dim;
          return (
            <li key={`${optionIndex}-${option}`}>
              <button
                type="button"
                className={`${question.type === 'ox' ? styles.oxOption : styles.option} ${state}`}
                onClick={() => choose(optionIndex)}
                disabled={answered}
              >
                <span>{option}</span>
                {answered && optionIndex === question.answerIndex && (
                  <Icon name="check" size={18} strokeWidth={3} />
                )}
                {answered && optionIndex === selected && !isCorrect && (
                  <Icon name="close" size={18} strokeWidth={3} />
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {answered && (
        <div
          className={`${styles.feedback} ${isCorrect ? styles.feedbackCorrect : styles.feedbackWrong}`}
          role="status"
        >
          <p className={styles.feedbackTitle}>
            {isCorrect ? '정답이에요!' : '아쉬워요, 틀렸어요.'}
          </p>
          <p>
            <strong>{question.term.term}</strong>: {question.term.easy}
          </p>
          <p className={styles.example}>예를 들면 {question.term.example}</p>
        </div>
      )}
      {answered && (
        <Button block size="lg" onClick={next} className={styles.next}>
          {isLast ? '결과 보기' : '다음 문제'}
        </Button>
      )}
    </div>
  );
}
