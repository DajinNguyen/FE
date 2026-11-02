import { Puzzle } from 'lucide-react';
import { Link } from 'react-router';
import { Icon } from '../../components/Icon';
import { hasDailyLimit, PUZZLE_REWARD_TEXT } from '../../config/usagePolicy';
import styles from './TermGameBanner.module.css';

/** 메인 아래쪽 작은 용어 학습 진입 (낱말퀴즈가 먼저) */
export function TermGameBanner() {
  return (
    <section className={styles.banner} aria-labelledby="home-learn">
      <span className={styles.icon} aria-hidden="true">
        <Puzzle size={22} strokeWidth={1.75} />
      </span>
      <div className={styles.body}>
        <h2 id="home-learn" className={styles.title}>
          용어 익히기
        </h2>
        <p className={styles.text}>낱말퀴즈와 문제로 주식 용어를 익혀요</p>
        {/* 하루 만들기 횟수 제한이 있을 때만 보상을 안내해요. (지금은 임시로 무제한) */}
        {hasDailyLimit() && <p className={styles.reward}>{PUZZLE_REWARD_TEXT}</p>}
        <div className={styles.links}>
          <Link to="/terms" className={styles.go}>
            낱말퀴즈 <Icon name="chevronRight" size={16} />
          </Link>
          <Link to="/terms?mode=game" className={styles.go}>
            용어 문제 <Icon name="chevronRight" size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
