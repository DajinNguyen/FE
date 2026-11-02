import { Link } from 'react-router';
import { Icon } from '../../components/Icon';
import { USAGE_POLICY } from '../../config/usagePolicy';
import styles from './TermGameBanner.module.css';

/** 용어 게임·낱말퀴즈로 가는 한 줄 배너. 크게 꾸미지 않아요. */
export function TermGameBanner() {
  return (
    <div className={styles.banner}>
      <span>
        <strong className={styles.title}>용어 익히기</strong>
        <span className={styles.text}>게임과 낱말퀴즈로 주식 용어를 익혀요</span>
        {/* 하루 만들기 횟수 제한이 있을 때만 보상을 안내해요. (지금은 임시로 무제한) */}
        {Number.isFinite(USAGE_POLICY.memberDailyReports) && (
          <span className={styles.reward}>낱말퀴즈를 풀면 AI 리포트를 한 번 더 만들 수 있어요</span>
        )}
      </span>
      <span className={styles.links}>
        <Link to="/terms?mode=game" className={styles.go}>
          용어 게임 <Icon name="chevronRight" size={16} />
        </Link>
        <Link to="/terms?mode=crossword" className={styles.go}>
          낱말퀴즈 <Icon name="chevronRight" size={16} />
        </Link>
      </span>
    </div>
  );
}
