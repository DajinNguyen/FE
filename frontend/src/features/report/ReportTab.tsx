import { useCallback, useState } from 'react';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { TermText } from '../../components/TermText';
import type { ReportFlow } from '../../hooks/useReportFlow';
import type { GoToTab } from '../companyTabs';
import { reportSections } from './reportSections';
import { SummaryCard } from './sections/SummaryCard';
import styles from './ReportTab.module.css';

interface ReportTabProps {
  flow: ReportFlow;
  onGoToTab: GoToTab;
}

const readingList = ['DART 재무제표', '최근 뉴스', '사업보고서 속 회사의 비전'];

export function ReportTab({ flow, onGoToTab }: ReportTabProps) {
  const { status, report, fromCache, runId, start, regenerate } = flow;
  const [revealedRun, setRevealedRun] = useState<number | null>(null);
  const handleComplete = useCallback(() => setRevealedRun(runId), [runId]);

  if (status === 'checking') {
    return (
      <div className={styles.skeletons} aria-busy="true">
        <div className={`${styles.skeleton} ${styles.skeletonTall}`} />
      </div>
    );
  }

  if (status === 'idle' || status === 'error') {
    return (
      <div className={styles.intro}>
        <div className={styles.introCard}>
          <p className={styles.introEyebrow}>
            <Icon name="sparkle" size={16} /> AI 기업 리포트
          </p>
          <h2 className={styles.introTitle}>
            어려운 숫자,
            <br />
            AI가 쉬운 말로 풀어 드릴게요
          </h2>
          <ul className={styles.introList}>
            {readingList.map((item) => (
              <li key={item}>
                <Icon name="check" size={16} strokeWidth={3} /> {item}
              </li>
            ))}
          </ul>
          <p className={styles.introNote}>
            세 가지를 함께 읽고, 핵심 포인트·그래프·퀴즈로 정리해요.
          </p>
        </div>
        {status === 'error' && (
          <p className={styles.error} role="alert">
            리포트를 만들지 못했어요. 잠시 후 다시 시도해 주세요.
          </p>
        )}
        <Button size="lg" block onClick={start}>
          {status === 'error' ? '다시 작성하기' : 'AI 리포트 작성'}
        </Button>
        <p className={styles.introDisclaimer}>
          교육용 정보이며 투자 추천이 아니에요. 숫자는 공식 자료를 그대로 쓰고, AI는 설명만 써요.
        </p>
      </div>
    );
  }

  // generating | ready
  const revealed = status === 'ready' && report !== null && (fromCache || revealedRun === runId);

  return (
    <div>
      <div className={styles.summary}>
        <SummaryCard
          key={runId}
          report={status === 'ready' ? report : null}
          fromCache={fromCache}
          onComplete={handleComplete}
          onRegenerate={regenerate}
        />
        <p className={styles.analyzed}>
          <TermText text="재무제표 · 뉴스 · 사업보고서를 함께 분석했어요" />
        </p>
      </div>

      {revealed && report ? (
        <div className={styles.reveal}>
          {reportSections.map(({ id, Component }) => (
            <Component key={id} report={report} onGoToTab={onGoToTab} />
          ))}
        </div>
      ) : (
        <div className={styles.skeletons} aria-hidden="true">
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
        </div>
      )}
    </div>
  );
}
