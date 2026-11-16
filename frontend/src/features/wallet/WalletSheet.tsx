import { useNavigate } from 'react-router';
import { Button } from '../../components/Button';
import { ErrorState } from '../../components/ErrorState';
import { Sheet } from '../../components/Sheet';
import { ADK_COST, ADK_NOTICE, formatAdk } from '../../config/currency';
import { useWallet } from '../../hooks/useWallet';
import { localDate } from '../../utils/date';
import styles from './Wallet.module.css';

/** "오늘 14:02" / "11월 15일 14:02" */
function formatWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  if (localDate(date) === localDate()) return `오늘 ${time}`;
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${time}`;
}

/** 내 앰똥깡: 잔액, 다음 보상까지 진행, 쓰는 곳, 최근 내역 10개 (모바일 아래 시트, PC 팝오버) */
export function WalletSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { wallet, isError, refetch } = useWallet();
  const navigate = useNavigate();

  const goPuzzle = () => {
    onClose();
    navigate('/terms');
  };

  return (
    <Sheet open={open} onClose={onClose} title="내 앰똥깡" placement="popover">
      {isError && !wallet ? (
        <ErrorState compact title="앰똥깡을 불러오지 못했어요" onRetry={() => refetch()} />
      ) : !wallet ? (
        <div className={styles.skeleton} aria-hidden="true" />
      ) : (
        <>
          <p className={styles.balance}>{formatAdk(wallet.balance)}</p>
          <dl className={styles.stats}>
            <div>
              <dt>다음 보상까지 낱말퀴즈</dt>
              <dd>
                <span className={styles.dots} aria-hidden="true">
                  {Array.from({ length: wallet.puzzle_progress.required }, (_, i) => (
                    <span key={i} className={i < wallet.puzzle_progress.done ? styles.on : ''} />
                  ))}
                </span>
                {wallet.puzzle_progress.done}/{wallet.puzzle_progress.required}
              </dd>
            </div>
            <div>
              <dt>오늘 보상</dt>
              <dd>
                {wallet.reward_count_today}/{wallet.reward_daily_limit}
              </dd>
            </div>
          </dl>

          <section aria-labelledby="wallet-uses">
            <h3 id="wallet-uses" className={styles.subTitle}>
              쓰는 곳
            </h3>
            <ul className={styles.uses}>
              <li>
                AI 리포트 만들기 <strong>{formatAdk(ADK_COST.report)}</strong>
              </li>
              <li>
                AI 챗봇 질문 <strong>{formatAdk(ADK_COST.chat)}</strong>
              </li>
            </ul>
          </section>

          <section aria-labelledby="wallet-history">
            <h3 id="wallet-history" className={styles.subTitle}>
              최근 내역
            </h3>
            {wallet.history.length === 0 ? (
              <p className={styles.empty}>아직 내역이 없어요</p>
            ) : (
              <ul className={styles.history}>
                {wallet.history.slice(0, 10).map((item) => (
                  <li key={item.id}>
                    <span className={item.type === 'earn' ? styles.earn : styles.spend}>
                      {item.type === 'earn' ? '+' : '−'}
                      {formatAdk(item.amount)}
                    </span>
                    <span className={styles.reason}>{item.reason}</span>
                    <time className={styles.when} dateTime={item.created_at}>
                      {formatWhen(item.created_at)}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <Button block onClick={goPuzzle}>
            낱말퀴즈 풀러 가기
          </Button>
          <p className={styles.notice}>{ADK_NOTICE}</p>
        </>
      )}
    </Sheet>
  );
}
