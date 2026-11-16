import { ADK_NOTICE, PUZZLE_REWARD_TEXT } from '../../config/currency';
import { useWallet } from '../../hooks/useWallet';
import styles from './Crossword.module.css';

/** 퍼즐 위 안내: "낱말퀴즈 3개를 풀면 20 ADK" + (로그인) 지금 진행·오늘 보상 */
export function PuzzleRewardNote() {
  const { wallet, isLoggedIn } = useWallet();
  return (
    <div className={styles.rewardNote}>
      <strong>{PUZZLE_REWARD_TEXT}</strong>
      {isLoggedIn && wallet ? (
        <span>
          지금 {wallet.puzzle_progress.done}/{wallet.puzzle_progress.required} · 오늘 보상{' '}
          {wallet.reward_count_today}/{wallet.reward_daily_limit}
        </span>
      ) : (
        !isLoggedIn && <span>로그인하면 받을 수 있어요</span>
      )}
      <span className={styles.adkNotice}>{ADK_NOTICE}</span>
    </div>
  );
}
