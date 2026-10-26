import { USAGE_POLICY } from '../../config/usagePolicy';
import { useAuth } from '../../hooks/useAuth';
import type { ReportQuota } from '../../hooks/useReportQuota';
import styles from './AiAnalysis.module.css';

/** [AI 리포트 만들기]·[다시 만들기] 옆의 남은 횟수 / 제한 안내 */
export function QuotaNotice({ quota }: { quota: ReportQuota }) {
  const { loginWithGoogle } = useAuth();

  if (quota.blocked === 'guest-daily') {
    return (
      <p className={styles.quota} role="note">
        오늘 만들 수 있는 리포트를 다 썼어요.{' '}
        <button type="button" className={styles.quotaLink} onClick={loginWithGoogle}>
          Google로 로그인
        </button>
        하면 하루 {USAGE_POLICY.memberDailyReports}번까지 더 이용할 수 있어요.
      </p>
    );
  }
  if (quota.blocked === 'member-daily') {
    return (
      <p className={styles.quota} role="note">
        오늘 만들 수 있는 리포트를 다 썼어요. 내일 다시 이용할 수 있어요.
      </p>
    );
  }
  if (quota.blocked === 'interval') {
    return (
      <p className={styles.quota} role="note">
        같은 기업은 {USAGE_POLICY.regenerateIntervalMinutes}분마다 만들 수 있어요.{' '}
        {quota.waitMinutes}분 뒤에 다시 해 주세요.
      </p>
    );
  }
  if (!Number.isFinite(quota.remaining)) return null;
  return <p className={styles.quota}>오늘 {quota.remaining}번 더 만들 수 있어요</p>;
}
