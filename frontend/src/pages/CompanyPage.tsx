import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { CompanyAvatar } from '../components/CompanyAvatar';
import { Icon } from '../components/Icon';
import { PriceChange } from '../components/PriceChange';
import { SampleBadge } from '../components/SampleBadge';
import { Tabs } from '../components/Tabs';
import { TermText } from '../components/TermText';
import { ChartTab } from '../features/chart/ChartTab';
import { CompanySidebar } from '../features/company/CompanySidebar';
import {
  companyTabs,
  DEFAULT_COMPANY_TAB,
  isCompanyTabId,
  type CompanyTabId,
  type GoToTab,
} from '../features/companyTabs';
import { FinancialsTab } from '../features/financials/FinancialsTab';
import { useCompany } from '../hooks/useCompanies';
import { formatPrice, formatTrillion } from '../utils/format';
import styles from './CompanyPage.module.css';

export function CompanyPage() {
  const { stockCode = '' } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab: CompanyTabId = isCompanyTabId(tabParam) ? tabParam : DEFAULT_COMPANY_TAB;
  const { data: company, isError, error } = useCompany(stockCode);

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
          description="홈에서 삼성전자를 검색해 보세요."
          action={<Button onClick={() => navigate('/')}>홈으로 가기</Button>}
        />
      </div>
    );
  }

  const marketLabel = company?.market === 'KOSDAQ' ? '코스닥' : '코스피';

  return (
    <div className={styles.page}>
      {backLink}

      <section className={styles.hero} aria-label="회사 시세 정보">
        {company ? (
          <>
            <div className={styles.identity}>
              <CompanyAvatar name={company.name} code={company.stock_code} size={56} />
              <div>
                <h1 className={styles.name}>{company.name}</h1>
                <p className={styles.companyMeta}>
                  {company.name_en} · {company.stock_code} · {marketLabel}
                </p>
              </div>
            </div>
            <div className={styles.quote}>
              <p className={styles.price}>
                {formatPrice(company.current_price.value)}
                <SampleBadge isSample={company.current_price.is_sample} />
              </p>
              <p className={styles.change}>
                <span className={styles.changeLabel}>어제보다</span>
                <PriceChange rate={company.change_rate.value} size="md" />
                <SampleBadge isSample={company.change_rate.is_sample} />
              </p>
              <div className={styles.tags}>
                <span className={styles.tag}>{company.sector}</span>
                <span className={styles.tag}>
                  <TermText text="시가총액" />{' '}
                  {formatTrillion(company.market_cap.value, { min: 0, max: 0 })}
                  <SampleBadge isSample={company.market_cap.is_sample} />
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className={styles.heroSkeleton} aria-hidden="true" />
        )}
      </section>

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
              {id === 'chart' && <ChartTab stockCode={stockCode} onGoToTab={goToTab} />}
              {id === 'financials' && <FinancialsTab stockCode={stockCode} />}
            </div>
          ))}
        </div>

        {company && (
          <div className={styles.sidebar}>
            <CompanySidebar stockCode={stockCode} />
          </div>
        )}
      </div>
    </div>
  );
}
