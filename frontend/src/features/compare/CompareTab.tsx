import { useSearchParams } from 'react-router';
import { CompanySearch } from '../../components/CompanySearch';
import { useCompany, usePeers } from '../../hooks/useCompanies';
import type { CompanyDetail } from '../../types';
import { formatAmount } from '../../utils/format';
import styles from './Compare.module.css';

/** 주소의 ?with= 비교할 기업 (지금 보는 기업과 같으면 없는 것으로) */
export function useCompareWith(stockCode: string) {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get('with');
  const withCode = raw && raw !== stockCode ? raw : null;
  const setWith = (code: string | null) =>
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        if (code) params.set('with', code);
        else params.delete('with');
        return params;
      },
      { replace: true },
    );
  return [withCode, setWith] as const;
}

/** 기업명 · 업종 · 시가총액 */
function CompanyCard({
  label,
  company,
  action,
}: {
  label: string;
  company: CompanyDetail | undefined;
  action?: React.ReactNode;
}) {
  return (
    <div className={styles.card}>
      <p className={styles.cardLabel}>{label}</p>
      {company ? (
        <>
          <p className={styles.cardName}>{company.name}</p>
          <p className={styles.cardMeta}>
            {company.sector} · 시가총액{' '}
            {company.market_cap ? formatAmount(company.market_cap.value, '조 원') : '자료 없음'}
          </p>
        </>
      ) : (
        <div className={styles.cardSkeleton} aria-hidden="true" />
      )}
      {action}
    </div>
  );
}

/** 비교할 기업 고르기: 검색 + 같은 산업의 비슷한 회사 칩 */
function ComparePicker({
  stockCode,
  onPick,
}: {
  stockCode: string;
  onPick: (code: string) => void;
}) {
  const peers = usePeers(stockCode);
  const chips = (peers.data ?? []).filter((p) => p.stock_code !== stockCode).slice(0, 4);
  return (
    <div className={`${styles.card} ${styles.picker}`}>
      <p className={styles.cardLabel}>비교할 기업</p>
      <CompanySearch
        variant="header"
        placeholder="비교할 기업 이름이나 종목코드"
        excludeCode={stockCode}
        onSelect={(company) => onPick(company.stock_code)}
      />
      {peers.isPending ? (
        <div className={styles.chipsSkeleton} aria-hidden="true" />
      ) : chips.length > 0 ? (
        <div className={styles.peers}>
          <p className={styles.peersTitle}>같은 산업의 비슷한 회사</p>
          <ul className={styles.chips}>
            {chips.map((peer) => (
              <li key={peer.stock_code}>
                <button
                  type="button"
                  className={styles.chip}
                  onClick={() => onPick(peer.stock_code)}
                >
                  {peer.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/** 기업 상세 "비교하기": 오른쪽 지금 보는 기업, 왼쪽 비교할 기업 */
export function CompareTab({ stockCode }: { stockCode: string }) {
  const [withCode, setWith] = useCompareWith(stockCode);
  const current = useCompany(stockCode);
  const other = useCompany(withCode ?? '');

  return (
    <section className={styles.compare} aria-labelledby="compare-title">
      <h2 id="compare-title" className={styles.title}>
        두 회사 비교하기
      </h2>
      <div className={`${styles.pair} ${withCode ? '' : styles.picking}`}>
        {withCode ? (
          <CompanyCard
            label="비교할 기업"
            company={other.data}
            action={
              <button type="button" className={styles.change} onClick={() => setWith(null)}>
                기업 바꾸기
              </button>
            }
          />
        ) : (
          <ComparePicker stockCode={stockCode} onPick={setWith} />
        )}
        <CompanyCard label="지금 보는 기업" company={current.data} />
      </div>
    </section>
  );
}
