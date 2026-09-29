import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import type { ReportStatus } from '../../hooks/useReportFlow';
import styles from './ReportActionButton.module.css';

interface ReportActionButtonProps {
  status: ReportStatus;
  fromCache: boolean;
  /** 지금 AI 리포트 탭을 보고 있는지 */
  onReportTab: boolean;
  onOpen: () => void;
  onRegenerate: () => void;
  className?: string;
}

/**
 * AI 리포트 버튼. 상태에 따라 문구와 동작이 바뀌어요.
 * 없음 → "AI 리포트 작성" / 작성 중 → 진행 표시 / 있음 → "AI 리포트 보기" (리포트 탭에서는 "다시 작성하기")
 */
export function ReportActionButton({
  status,
  fromCache,
  onReportTab,
  onOpen,
  onRegenerate,
  className,
}: ReportActionButtonProps) {
  if (status === 'ready' && onReportTab) {
    return (
      <Button variant="secondary" size="lg" block className={className} onClick={onRegenerate}>
        <Icon name="refresh" size={18} /> 다시 작성하기
      </Button>
    );
  }

  const label =
    status === 'generating'
      ? 'AI가 리포트를 쓰고 있어요…'
      : status === 'ready'
        ? fromCache
          ? '저장된 AI 리포트 보기'
          : 'AI 리포트 보기'
        : 'AI 리포트 작성';

  return (
    <Button size="lg" block className={className} onClick={onOpen} disabled={status === 'checking'}>
      {status === 'generating' ? (
        <span className={styles.spinner} aria-hidden="true" />
      ) : (
        <Icon name="sparkle" size={18} />
      )}
      {label}
    </Button>
  );
}
