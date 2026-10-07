import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { Button } from '../components/Button';
import { DetailNotice } from '../components/DetailNotice';
import { EmptyState } from '../components/EmptyState';
import { Icon } from '../components/Icon';
import { Tabs } from '../components/Tabs';
import { CommunityTab } from '../features/community/CommunityTab';
import { CompanyAside } from '../features/company/CompanyAside';
import { CompanyHeader } from '../features/company/CompanyHeader';
import { CompanyInfoTab } from '../features/company-info/CompanyInfoTab';
import {
  companyTabs,
  DEFAULT_COMPANY_TAB,
  isCompanyTabId,
  type CompanyTabId,
  type GoToTab,
} from '../features/companyTabs';
import { FinancialsTab } from '../features/financials/FinancialsTab';
import { NewsTab } from '../features/news/NewsTab';
import { OverviewTab } from '../features/overview/OverviewTab';
import { useCompany } from '../hooks/useCompanies';
import { useCompanyReport } from '../hooks/useCompanyReport';
import styles from './CompanyPage.module.css';

export function CompanyPage() {
  const { stockCode = '' } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab: CompanyTabId = isCompanyTabId(tabParam) ? tabParam : DEFAULT_COMPANY_TAB;

  const { data: company, isError, error } = useCompany(stockCode);
  const report = useCompanyReport(stockCode);

  const tabsAnchorRef = useRef<HTMLDivElement>(null);
  const [scrollTarget, setScrollTarget] = useState<{ id?: string; seq: number } | null>(null);

  const goToTab: GoToTab = (next, anchorId) => {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        params.set('tab', next);
        return params;
      },
      { replace: true },
    );
    setScrollTarget({ id: anchorId, seq: Date.now() });
  };

  // 탭이 바뀐 뒤 화면이 그려지면, 탭 바(또는 지정한 위치)로 스크롤해요.
  useEffect(() => {
    if (!scrollTarget) return;
    const target = scrollTarget.id
      ? document.getElementById(scrollTarget.id)
      : tabsAnchorRef.current;
    if (!target) return;
    const below = target.getBoundingClientRect().top < 0 || scrollTarget.id;
    if (below || window.scrollY > (tabsAnchorRef.current?.offsetTop ?? 0)) {
      target.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    }
  }, [scrollTarget]);

  const goBack = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else navigate('/');
  };

  const backLink = (
    <button type="button" className={styles.back} onClick={goBack}>
      <Icon name="back" size={18} /> 뒤로
    </button>
  );

  if (isError) {
    return (
      <div className={styles.page}>
        {backLink}
        <EmptyState
          title={error.message}
          description="기업 이름이나 종목코드를 다시 확인해 주세요."
          action={<Button onClick={() => navigate('/')}>홈으로 가기</Button>}
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {backLink}
      {company ? (
        <CompanyHeader company={company} />
      ) : (
        <div className={styles.headerSkeleton} aria-hidden="true" />
      )}

      <div ref={tabsAnchorRef} className={styles.tabsAnchor} />
      <div className={styles.tabs}>
        <Tabs
          items={companyTabs}
          value={tab}
          onChange={(next) => goToTab(next)}
          idPrefix="company"
        />
      </div>

      <div className={styles.layout}>
        <div className={styles.content}>
          {/* 탭을 오가도 그래프·리포트 상태가 유지되도록 모든 탭을 그려두고 숨겨요. */}
          {companyTabs.map(({ id }) => (
            <div
              key={id}
              role="tabpanel"
              id={`company-panel-${id}`}
              aria-labelledby={`company-tab-${id}`}
              hidden={tab !== id}
              className={styles.panel}
            >
              {id !== 'overview' && <DetailNotice onBack={() => goToTab('overview')} />}
              {id === 'overview' && <OverviewTab flow={report} onGoToTab={goToTab} />}
              {id === 'financials' && <FinancialsTab stockCode={stockCode} />}
              {id === 'news' && <NewsTab stockCode={stockCode} />}
              {id === 'info' && <CompanyInfoTab stockCode={stockCode} onGoToTab={goToTab} />}
              {id === 'community' && <CommunityTab />}
            </div>
          ))}
        </div>
        {company && (
          <div className={styles.sidebar}>
            <CompanyAside stockCode={stockCode} />
          </div>
        )}
      </div>
    </div>
  );
}
