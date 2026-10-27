import { COMMUNITY_NOTICE } from '../../config/communityRules';
import styles from './Community.module.css';

/** 커뮤니티 맨 위에 항상 보이는 금지 안내 */
export function CommunityNotice() {
  return (
    <p className={styles.notice} role="note">
      <strong>커뮤니티 규칙</strong> {COMMUNITY_NOTICE}
    </p>
  );
}
