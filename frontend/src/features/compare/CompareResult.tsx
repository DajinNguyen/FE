import { Link } from 'react-router';
import { ApiError } from '../../api/errors';
import { ErrorState } from '../../components/ErrorState';
import { Icon } from '../../components/Icon';
import { useCompanyCompare } from '../../hooks/useCompanies';
import type { CompareCompany } from '../../types';
import { CompareBars } from './CompareBars';
import { hasNoNumbers } from './compareMetrics';
import { CompareSummary } from './CompareSummary';
import styles from './Compare.module.css';

const basisOf = (c: CompareCompany, fallback: { period: string; basis: string }) =>
  `${c.base_period ?? fallback.period} · ${c.basis ?? fallback.basis}`;

/** 비교 결과: 기준 → 지표 막대 → [왼쪽 기업 페이지로] (left = 비교할 기업, right = 지금 보는 기업) */
export function CompareResult({ left, right }: { left: string; right: string }) {
  const { data, isPending, isError, error, refetch } = useCompanyCompare(left, right);

  if (isPending) return <div className={styles.resultSkeleton} aria-hidden="true" />;
  const notFound = error instanceof ApiError && error.status === 404;
  if (isError && !notFound) {
    return (
      <ErrorState title="비교 자료를 불러오지 못했어요" error={error} onRetry={() => refetch()} />
    );
  }
  if (!data || (hasNoNumbers(data.left) && hasNoNumbers(data.right))) {
    return <p className={styles.empty}>이 기업의 재무 자료가 아직 없어요</p>;
  }

  const common = { period: data.base_period, basis: data.basis };
  const leftBasis = basisOf(data.left, common);
  const rightBasis = basisOf(data.right, common);

  return (
    <div className={styles.result}>
      <p className={styles.basis}>
        기준 <strong>{`${data.base_period} · ${data.basis}`}</strong>
      </p>
      {leftBasis !== rightBasis && (
        <p className={styles.mismatch} role="note">
          두 회사의 기준이 달라요 ({data.left.name} {leftBasis}, {data.right.name} {rightBasis}).
          숫자를 그대로 비교할 때 참고해 주세요.
        </p>
      )}
      <CompareBars left={data.left} right={data.right} />
      <CompareSummary data={data} />
      <Link to={`/companies/${data.left.stock_code}`} className={styles.goLeft}>
        {data.left.name} 페이지로 <Icon name="chevronRight" size={16} />
      </Link>
    </div>
  );
}
