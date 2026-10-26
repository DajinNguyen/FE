import { useState } from 'react';
import { Link } from 'react-router';
import { DataAsOf } from '../../components/DataAsOf';
import { Icon } from '../../components/Icon';
import { SegmentedControl } from '../../components/SegmentedControl';
import { FEATURE_RISING_COMPANIES, HOME_TRADING_LIMIT } from '../../config/home';
import type { CompanySummary, HomeDashboard } from '../../types';
import { CompanyListRow } from './CompanyListRow';
import { SectorCompanies } from './SectorCompanies';
import listStyles from './CompanyList.module.css';
import styles from './CompanyBrowse.module.css';

type BrowseTab = 'sector' | 'trading' | 'rising';

const tabs = [
  { value: 'sector', label: '업종별 기업' },
  { value: 'trading', label: '거래 많은 기업' },
  // 떠오르는 기업은 선정 기준이 정해질 때까지 설정으로만 보여요.
  ...(FEATURE_RISING_COMPANIES ? [{ value: 'rising', label: '떠오르는 기업' }] : []),
] as { value: BrowseTab; label: string }[];

interface CompanyBrowseProps {
  data: HomeDashboard;
  onSelect: (company: CompanySummary) => void;
}

/** 메인 아래쪽 "기업 둘러보기": 업종별 기업 / 거래 많은 기업을 하나로 묶어 작게 (5개씩) */
export function CompanyBrowse({ data, onSelect }: CompanyBrowseProps) {
  const [tab, setTab] = useState<BrowseTab>('sector');

  return (
    <section className={styles.browse} aria-labelledby="company-browse">
      <div className={styles.head}>
        <h2 id="company-browse" className={styles.title}>
          기업 둘러보기
        </h2>
        <SegmentedControl label="기업 목록 종류" options={tabs} value={tab} onChange={setTab} />
      </div>

      {tab === 'sector' && (
        <SectorCompanies companies={data.sector_companies} onSelect={onSelect} />
      )}

      {tab === 'trading' && (
        <>
          <div className={styles.note}>
            <DataAsOf value={data.base_time} suffix="기준 · 거래대금 순" />
            <Link to="/rankings/trading" className={styles.more}>
              전체 보기 <Icon name="chevronRight" size={16} />
            </Link>
          </div>
          <ol className={listStyles.list} aria-label="거래 많은 기업">
            {data.trading_value_top.slice(0, HOME_TRADING_LIMIT).map((company, index) => (
              <CompanyListRow
                key={company.stock_code}
                company={company}
                rank={index + 1}
                onSelect={onSelect}
              />
            ))}
          </ol>
        </>
      )}

      {tab === 'rising' && (
        <>
          <p className={styles.note}>{data.rising.criteria}</p>
          <ul className={listStyles.list} aria-label="떠오르는 기업">
            {data.rising.items.slice(0, HOME_TRADING_LIMIT).map((company) => (
              <CompanyListRow key={company.stock_code} company={company} onSelect={onSelect} />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
