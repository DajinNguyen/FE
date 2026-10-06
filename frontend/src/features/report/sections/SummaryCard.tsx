import { useEffect, useState } from 'react';
import { Icon } from '../../../components/Icon';
import { TermText } from '../../../components/TermText';
import { useTypewriter } from '../../../hooks/useTypewriter';
import type { CompanyReport } from '../../../types';
import styles from './SummaryCard.module.css';

const generationSteps = [
  'DART 재무제표 불러오기',
  '최근 뉴스 확인하기',
  '사업보고서 비전 읽기',
  'AI가 쉬운 말로 정리하기',
];

interface SummaryCardProps {
  /** 생성이 끝나기 전에는 null */
  report: CompanyReport | null;
  /** 서버에 저장돼 있던 리포트면 생성 과정 없이 바로 보여줘요. */
  fromCache: boolean;
  onComplete: () => void;
  onRegenerate: () => void;
}

/** AI 한 줄 요약. 새로 만들 땐 생성 단계를 보여주고, 저장된 리포트면 바로 보여줘요. */
export function SummaryCard({ report, fromCache, onComplete, onRegenerate }: SummaryCardProps) {
  const instant = Boolean(report) && fromCache;
  const [doneSteps, setDoneSteps] = useState(0);

  useEffect(() => {
    if (instant) return;
    // 응답 전에는 마지막 단계("정리하기")에서 기다리고, 응답이 오면 남은 단계를 빠르게 체크해요.
    const max = report ? generationSteps.length : generationSteps.length - 1;
    if (doneSteps >= max) return;
    const timer = setTimeout(() => setDoneSteps((n) => n + 1), report ? 280 : 720);
    return () => clearTimeout(timer);
  }, [doneSteps, report, instant]);

  const stepsDone = instant || doneSteps >= generationSteps.length;
  const { typed, done: typedAll } = useTypewriter(
    report?.summary ?? '',
    Boolean(report) && !instant && stepsDone,
  );
  const finished = instant || typedAll;

  useEffect(() => {
    if (finished) onComplete();
  }, [finished, onComplete]);

  return (
    <div className={styles.card} aria-busy={!finished}>
      <p className={styles.eyebrow}>
        <Icon name="sparkle" size={16} /> AI 한 줄 요약
      </p>

      {!stepsDone ? (
        <ol className={styles.steps} aria-label="리포트 생성 단계">
          {generationSteps.map((step, index) => {
            const state = index < doneSteps ? 'done' : index === doneSteps ? 'active' : 'pending';
            return (
              <li key={step} className={`${styles.step} ${styles[state]}`}>
                <span className={styles.stepIcon} aria-hidden="true">
                  {state === 'done' ? <Icon name="check" size={14} strokeWidth={3} /> : null}
                </span>
                <span>{step}</span>
                <span className="visually-hidden">
                  {state === 'done' ? '완료' : state === 'active' ? '진행 중' : '대기'}
                </span>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className={styles.summary}>
          {finished && report ? <TermText text={report.summary} /> : typed}
          {!finished && <span className={styles.caret} aria-hidden="true" />}
        </p>
      )}

      {finished && report && (
        <div className={styles.footer}>
          <span className={styles.meta}>
            {instant
              ? '저장된 리포트 · 바로 불러왔어요'
              : `${report.generation_seconds}초 만에 생성`}
          </span>
          <button type="button" className={styles.replay} onClick={onRegenerate}>
            <Icon name="refresh" size={14} /> 다시 작성하기
          </button>
        </div>
      )}
    </div>
  );
}
