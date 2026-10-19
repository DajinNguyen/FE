import { useState } from 'react';
import { Tabs } from '../../components/Tabs';
import { HOME_SECTOR_LIMIT } from '../../config/home';
import { SECTOR_GROUPS } from '../../config/sectorGroups';
import type { CompanySummary, SectorGroup } from '../../types';
import { CompanyListRow } from './CompanyListRow';
import styles from './CompanyList.module.css';

interface SectorCompaniesProps {
  companies: Record<SectorGroup, CompanySummary[]>;
  onSelect: (company: CompanySummary) => void;
}

/** 업종별 기업. 탭 이름과 순서는 SECTOR_GROUPS 에서 가져와요. 휴대폰에서는 탭을 가로로 밀어요. */
export function SectorCompanies({ companies, onSelect }: SectorCompaniesProps) {
  const [group, setGroup] = useState<SectorGroup>(SECTOR_GROUPS[0].id);
  const items = (companies[group] ?? []).slice(0, HOME_SECTOR_LIMIT);

  return (
    <>
      <Tabs items={SECTOR_GROUPS} value={group} onChange={setGroup} idPrefix="sector" />
      <div
        role="tabpanel"
        id={`sector-panel-${group}`}
        aria-labelledby={`sector-tab-${group}`}
        className={styles.panel}
      >
        {items.length > 0 ? (
          <ul className={styles.list}>
            {items.map((company) => (
              <CompanyListRow key={company.stock_code} company={company} onSelect={onSelect} />
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>이 업종의 기업은 아직 준비 중이에요</p>
        )}
      </div>
    </>
  );
}
