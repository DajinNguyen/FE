import { useEffect, useState } from 'react';
import { Icon } from '../../components/Icon';
import { ESTIMATED_SECONDS } from '../../hooks/useCompanyReport';
import styles from './AiAnalysis.module.css';

const steps = ['재무제표 확인', '뉴스 확인', '기업 비전 읽기', '핵심 포인트 정리'];

interface ReportProgressProps {
  startedAt: number | null;
  onCancel: () => void;
  /** 다시 만드는 중이면 기존 리포트 위에 얇게 보여줘요. */
  compact?: boolean;
}

/**
 * 리포트 생성 진행 상황. 서버가 단계를 알려주지 않아서 경과 시간으로 단계를 짐작해요.
 * 마지막 단계는 응답이 올 때까지 "진행 중"으로 기다려요.
 */
export function ReportProgress({ startedAt, onCancel, compact }: ReportProgressProps) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const elapsed = startedAt ? Math.max(0, Math.floor((now - startedAt) / 1000)) : 0;
  const active = Math.min(
    steps.length - 1,
    Math.floor(elapsed / (ESTIMATED_SECONDS / steps.length)),
  );
  const percent = Math.min(95, Math.round((elapsed / ESTIMATED_SECONDS) * 100));

  return (
    <div
      className={`${styles.progress} ${compact ? styles.progressCompact : ''}`}
      role="status"
      aria-live="polite"
    >
      <div className={styles.progressHead}>
        <p className={styles.progressTitle}>
          <span className={styles.spinner} aria-hidden="true" />
          {compact ? 'AI가 리포트를 다시 만들고 있어요' : 'AI가 리포트를 만들고 있어요'}
        </p>
        <button type="button" className={styles.cancel} onClick={onCancel}>
          취소
        </button>
      </div>
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
      <p className={styles.time}>
        약 {ESTIMATED_SECONDS}초 걸려요 · {elapsed}초 지났어요
      </p>
      <ol className={styles.steps} aria-label="리포트 생성 단계">
        {steps.map((step, index) => {
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
  );
}
