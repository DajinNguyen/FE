import { Link } from 'react-router';
import { ADK_NOTICE, ADK_SHORTAGE_TEXT, formatAdk } from '../../config/currency';
import type { CompanyReportFlow } from '../../hooks/useCompanyReport';
import styles from './AiAnalysis.module.css';

/** [AI 리포트 만들기]·[다시 만들기] 옆 안내: 잔액, 잔액 부족, 실제 돈이 아니라는 안내 */
export function CostNotice({ adk }: { adk: CompanyReportFlow['adk'] }) {
  // 비로그인은 버튼을 누르면 로그인 시트에서 안내해요.
  if (!adk.isLoggedIn) return null;
  if (adk.shortage) {
    return (
      <p className={styles.quota} role="note">
        {ADK_SHORTAGE_TEXT}{' '}
        <Link to="/terms" className={styles.quotaLink}>
          낱말퀴즈 풀러 가기
        </Link>
      </p>
    );
  }
  if (adk.balance === null) return null;
  return (
    <p className={styles.quota} title={ADK_NOTICE}>
      내 잔액 {formatAdk(adk.balance)}
    </p>
  );
}

/** 만들기 실패 후 "ADK 는 빠지지 않았어요" 안내 */
export function ChargeNotice({ adk }: { adk: CompanyReportFlow['adk'] }) {
  if (!adk.chargeNotice) return null;
  return <p className={styles.quota}>{adk.chargeNotice}</p>;
}
