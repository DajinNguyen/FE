import { Button } from '../../components/Button';
import { CompanyBusiness, CompanyMore } from '../company-info/CompanyInfo';
import type { GoToTab } from '../companyTabs';
import { PriceTrend } from './PriceTrend';
import { RecentPerformance } from './RecentPerformance';
import styles from './OverviewTab.module.css';

interface OverviewTabProps {
  stockCode: string;
  onGoToTab: GoToTab;
}

/**
 * 검색하고 들어오면 처음 보이는 탭.
 * PC(1024px 이상): 왼쪽 무슨 사업 → 최근 사업 성과 → AI 분석 보기, 오른쪽 주가 흐름(스크롤해도 따라와요)
 * 모바일: 무슨 사업 → 최근 사업 성과 → 주가 흐름 → AI 분석 보기
 * 회사의 방향·기본 정보는 그 아래에 있어요.
 */
export function OverviewTab({ stockCode, onGoToTab }: OverviewTabProps) {
  return (
    <div className={styles.layout}>
      <div className={styles.business}>
        <CompanyBusiness stockCode={stockCode} />
      </div>
      <div className={styles.performance}>
        <RecentPerformance stockCode={stockCode} />
      </div>
      <div className={styles.price}>
        <PriceTrend stockCode={stockCode} />
      </div>
      <div className={styles.cta}>
        <Button size="lg" onClick={() => onGoToTab('analysis')}>
          AI 분석 보기
        </Button>
      </div>
      <div className={styles.more}>
        <CompanyMore stockCode={stockCode} />
      </div>
    </div>
  );
}
