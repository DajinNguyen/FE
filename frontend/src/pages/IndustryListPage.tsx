import { Link } from 'react-router';
import { ErrorState } from '../components/ErrorState';
import { industryColorStyle, industryIcon } from '../config/industryIcons';
import { useIndustryList } from '../hooks/useIndustries';
import type { IndustryListItem } from '../types';
import styles from './IndustryListPage.module.css';

function IndustryTile({ industry }: { industry: IndustryListItem }) {
  const Icon = industryIcon(industry.icon_key);
  return (
    <li>
      <Link
        to={`/industries/${industry.industry_id}`}
        className={styles.tile}
        style={industryColorStyle(industry.icon_key)}
        aria-label={`${industry.name} 산업, 기업 ${industry.company_count.toLocaleString('ko-KR')}곳`}
      >
        <span className={styles.icon} aria-hidden="true">
          <Icon size={28} strokeWidth={1.5} />
        </span>
        <span className={styles.name}>{industry.name}</span>
        <span className={styles.count}>
          기업 {industry.company_count.toLocaleString('ko-KR')}곳
        </span>
      </Link>
    </li>
  );
}

/** 전체 산업(키워드) 목록: 누르면 그 산업 화면으로 가요. */
export function IndustryListPage() {
  const { data, isPending, isError, error, refetch } = useIndustryList();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>전체 산업</h1>
        <p className={styles.note}>
          {data ? `산업 ${data.length}개 · ` : ''}산업을 누르면 관련 기업과 뉴스를 볼 수 있어요
        </p>
      </header>

      {isError && (
        <ErrorState title="산업 목록을 불러오지 못했어요" error={error} onRetry={() => refetch()} />
      )}
      {isPending && <div className={styles.loading} aria-hidden="true" />}
      {data && data.length === 0 && <p className={styles.hint}>아직 보여줄 산업이 없어요.</p>}
      {data && data.length > 0 && (
        <ul className={styles.grid} aria-label="전체 산업">
          {data.map((industry) => (
            <IndustryTile key={industry.industry_id} industry={industry} />
          ))}
        </ul>
      )}
    </div>
  );
}
