import { useEffect, useState } from 'react';
import { Icon } from '../../components/Icon';
import { ESTIMATED_SECONDS } from '../../hooks/useCompanyReport';
import { keyPointOrder, REPORT_STEPS } from './reportMeta';
import styles from './ReportWaiting.module.css';

interface WaitingProps {
  /** 생성을 처음 본 시각 (경과 시간 계산용) */
  startedAt: number | null;
  onCancel: () => void;
  /**
   * 지금 단계 (0부터). 주지 않으면 경과 시간으로 짐작해요.
   * 시간으로 짐작할 때는 마지막 단계에서 멈춰 있다가 응답이 오면 화면이 바뀌어요.
   */
  activeStep?: number;
}

function useElapsedSeconds(startedAt: number | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  return startedAt ? Math.max(0, Math.floor((now - startedAt) / 1000)) : 0;
}

/** 시간 기준 진행률. 응답이 오기 전에는 95%를 넘지 않아요. */
const percentOf = (elapsed: number) =>
  Math.min(95, Math.round((elapsed / ESTIMATED_SECONDS) * 100));

/** 처음 만들 때: 진행 단계 + 경과 시간 + 핵심 포인트 모양 스켈레톤 */
export function ReportWaiting({ startedAt, onCancel, activeStep }: WaitingProps) {
  const elapsed = useElapsedSeconds(startedAt);
  const timeStep = Math.floor(elapsed / (ESTIMATED_SECONDS / REPORT_STEPS.length));
  const active = Math.min(REPORT_STEPS.length - 1, activeStep ?? timeStep);

  return (
    <>
      <div className={styles.progress} role="status" aria-live="polite">
        <div className={styles.head}>
          <p className={styles.title}>
            <span className={styles.spinner} aria-hidden="true" />
            AI가 리포트를 만들고 있어요
          </p>
          <button type="button" className={styles.cancel} onClick={onCancel}>
            취소
          </button>
        </div>
        <ProgressBar percent={percentOf(elapsed)} />
        <p className={styles.time}>
          보통 {ESTIMATED_SECONDS}초 정도 걸려요 · {elapsed}초 지났어요
        </p>
        <ol className={styles.steps} aria-label="리포트 생성 단계">
          {REPORT_STEPS.map((step, index) => {
            const state = index < active ? 'done' : index === active ? 'current' : 'pending';
            return (
              <li key={step} className={`${styles.step} ${styles[state]}`}>
                <span className={styles.stepIcon} aria-hidden="true">
                  {state === 'done' && <Icon name="check" size={12} strokeWidth={3} />}
                </span>
                {step}
                <span className="visually-hidden">
                  {state === 'done' ? ' 완료' : state === 'current' ? ' 진행 중' : ' 대기'}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
      <ReportSkeleton />
    </>
  );
}

/** 다시 만들 때: 기존 리포트는 그대로 두고 위에 진행 표시줄만 */
export function RegenerateProgress({ startedAt, onCancel }: WaitingProps) {
  const elapsed = useElapsedSeconds(startedAt);
  return (
    <div className={styles.compact} role="status" aria-live="polite">
      <div className={styles.head}>
        <p className={styles.compactTitle}>
          AI가 리포트를 다시 만들고 있어요 · {elapsed}초 지났어요
        </p>
        <button type="button" className={styles.cancel} onClick={onCancel}>
          취소
        </button>
      </div>
      <ProgressBar percent={percentOf(elapsed)} />
    </div>
  );
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div
      className={styles.track}
      role="progressbar"
      aria-label="리포트 생성 진행률"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
    >
      <div className={styles.bar} style={{ width: `${percent}%` }} />
    </div>
  );
}

/** 핵심 포인트 모양의 빈 자리 (처음 불러올 때·처음 만들 때) */
export function ReportSkeleton() {
  return (
    <div className={styles.skeleton} aria-hidden="true">
      <div className={`${styles.line} ${styles.headline}`} />
      {keyPointOrder.map((category) => (
        <div key={category} className={styles.point}>
          <div className={`${styles.line} ${styles.short}`} />
          <div className={`${styles.line} ${styles.title}`} />
          <div className={styles.line} />
          <div className={`${styles.line} ${styles.medium}`} />
        </div>
      ))}
    </div>
  );
}
