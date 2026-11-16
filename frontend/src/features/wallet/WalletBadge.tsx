import { Coins } from 'lucide-react';
import { useState } from 'react';
import { ADK_COST, CURRENCY_UNIT, formatAdk } from '../../config/currency';
import { useWallet } from '../../hooks/useWallet';
import { WalletSheet } from './WalletSheet';
import styles from './Wallet.module.css';

/** 헤더 계정 이름 옆 앰똥깡 잔액 배지 (로그인 사용자만). 누르면 내 앰똥깡 시트 */
export function WalletBadge() {
  const { isLoggedIn, balance, isError } = useWallet();
  const [open, setOpen] = useState(false);
  if (!isLoggedIn) return null;

  // 리포트 한 번(7 ADK)도 못 만들 만큼 적으면 연한 경고 색
  const low = balance !== null && balance < ADK_COST.report;
  const label =
    balance !== null ? formatAdk(balance) : isError ? `- ${CURRENCY_UNIT}` : `… ${CURRENCY_UNIT}`;

  return (
    <>
      <button
        type="button"
        className={`${styles.badge} ${low ? styles.low : ''}`}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`내 앰똥깡 ${label}${low ? ' (부족해요)' : ''}`}
      >
        <Coins size={16} aria-hidden="true" />
        {label}
      </button>
      <WalletSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
