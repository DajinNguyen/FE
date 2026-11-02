import { useId, useState } from 'react';
import { Button } from '../../components/Button';
import { Sheet } from '../../components/Sheet';
import { useReport } from '../../hooks/useReport';
import type { ReportInput, ReportReason } from '../../types';
import { reportReasonLabels, reportReasons } from './communityLabels';
import styles from './CommunityPost.module.css';

interface ReportSheetProps {
  /** 신고할 대상. null 이면 닫혀 있어요. */
  target: Omit<ReportInput, 'reason'> | null;
  onClose: () => void;
}

/** 신고 사유를 고르는 시트. 같은 대상은 한 번만 신고돼요. */
export function ReportSheet({ target, onClose }: ReportSheetProps) {
  const name = useId();
  const report = useReport();
  const [reason, setReason] = useState<ReportReason | null>(null);

  const close = () => {
    setReason(null);
    onClose();
  };

  const submit = () => {
    if (!target || !reason) return;
    report.mutate({ ...target, reason }, { onSettled: close });
  };

  return (
    <Sheet
      open={target !== null}
      onClose={close}
      title={target?.target_type === 'comment' ? '댓글 신고' : '글 신고'}
    >
      <fieldset className={styles.reasons}>
        <legend>신고하는 이유를 골라 주세요</legend>
        {reportReasons.map((value) => (
          <label key={value} className={styles.reason}>
            <input
              type="radio"
              name={name}
              value={value}
              checked={reason === value}
              onChange={() => setReason(value)}
            />
            {reportReasonLabels[value]}
          </label>
        ))}
      </fieldset>
      <Button size="lg" block onClick={submit} disabled={!reason || report.isPending}>
        신고하기
      </Button>
      <Button block variant="ghost" onClick={close}>
        취소
      </Button>
    </Sheet>
  );
}
