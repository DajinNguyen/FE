import { useState } from 'react';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import type { QuizQuestion } from '../../types';
import styles from './Quiz.module.css';

const resultMessage = (score: number, total: number) => {
  if (score === total) return '완벽해요! 리포트를 꼼꼼하게 읽었네요.';
  if (score >= total / 2) return '잘했어요! 틀린 문제는 해설을 다시 읽어 봐요.';
  return '괜찮아요. 리포트를 한 번 더 보고 다시 풀어 봐요.';
};

export function Quiz({ questions }: { questions: QuizQuestion[] }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  if (questions.length === 0) return null;

  if (finished) {
    return (
      <div className={styles.card}>
        <p className={styles.progress}>결과</p>
        <p className={styles.score}>
          {questions.length}문제 중 <strong>{score}문제</strong> 맞혔어요
        </p>
        <p className={styles.resultMessage}>{resultMessage(score, questions.length)}</p>
        <Button
          variant="secondary"
          block
          onClick={() => {
            setIndex(0);
            setSelected(null);
            setScore(0);
            setFinished(false);
          }}
        >
          다시 풀기
        </Button>
      </div>
    );
  }

  const question = questions[index];
  const answered = selected !== null;
  const isCorrect = selected === question.answer_index;
  const isLast = index === questions.length - 1;

  const choose = (optionIndex: number) => {
    if (answered) return;
    setSelected(optionIndex);
    if (optionIndex === question.answer_index) setScore((s) => s + 1);
  };

  const next = () => {
    if (isLast) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
  };

  return (
    <div className={styles.card} key={question.id}>
      <p className={styles.progress}>
        문제 {index + 1} / {questions.length}
      </p>
      <h3 className={styles.question}>{question.question}</h3>
      <ul className={styles.options}>
        {question.options.map((option, optionIndex) => {
          const state = !answered
            ? ''
            : optionIndex === question.answer_index
              ? styles.correct
              : optionIndex === selected
                ? styles.wrong
                : styles.dim;
          return (
            <li key={option}>
              <button
                type="button"
                className={`${styles.option} ${state}`}
                onClick={() => choose(optionIndex)}
                disabled={answered}
              >
                <span>{option}</span>
                {answered && optionIndex === question.answer_index && (
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
            {isCorrect
              ? '정답이에요!'
              : `아쉬워요. 정답은 "${question.options[question.answer_index]}"예요.`}
          </p>
          <p>{question.explanation}</p>
        </div>
      )}

      {answered && (
        <Button block onClick={next} className={styles.next}>
          {isLast ? '결과 보기' : '다음 문제'}
        </Button>
      )}
    </div>
  );
}
