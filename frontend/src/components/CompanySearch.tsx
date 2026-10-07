import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { useCompanySearch } from '../hooks/useCompanySearch';
import { useOpenCompany } from '../hooks/useOpenCompany';
import { useRecentSearches, type RecentSearch } from '../hooks/useRecentSearches';
import type { CompanySummary } from '../types';
import { CompanyAvatar } from './CompanyAvatar';
import { HighlightText } from './HighlightText';
import { Icon } from './Icon';
import styles from './CompanySearch.module.css';

const marketLabel = { KOSPI: '코스피', KOSDAQ: '코스닥' } as const;

interface CompanySearchProps {
  /** hero: 메인 화면의 큰 검색창 / header: 상단 내비게이션의 작은 검색창 */
  variant: 'hero' | 'header';
  autoFocus?: boolean;
}

type Option =
  { kind: 'result'; company: CompanySummary } | { kind: 'recent'; company: RecentSearch };

/**
 * 기업 검색창 (한글·영어·종목코드). 위·아래 키로 고르고 엔터로 열어요.
 * 입력이 비어 있을 때는 최근 검색을 보여줘요.
 */
export function CompanySearch({ variant, autoFocus }: CompanySearchProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const search = useCompanySearch(query);
  const recent = useRecentSearches();
  const openCompany = useOpenCompany();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmed = query.trim();
  const isSearching = trimmed.length > 0;
  const isWaiting = isSearching && (search.isFetching || search.keyword !== trimmed);

  const options: Option[] = isSearching
    ? (search.data ?? []).map((company) => ({ kind: 'result', company }))
    : recent.items.map((company) => ({ kind: 'recent', company }));

  const showPanel = open && (isSearching || options.length > 0);
  const optionId = (index: number) => `${listId}-option-${index}`;

  const select = (option: Option) => {
    openCompany(option.company);
    setQuery('');
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (options.length === 0) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(true);
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((i) => (i + step + options.length) % options.length);
    } else if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      const option = options[activeIndex] ?? (isSearching && !isWaiting ? options[0] : undefined);
      if (option) select(option);
    }
  };

  return (
    <div
      className={`${styles.search} ${styles[variant]}`}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <div className={styles.box}>
        <Icon name="search" size={variant === 'hero' ? 22 : 18} className={styles.icon} />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          className={styles.input}
          placeholder={
            variant === 'hero' ? '기업 이름, 영어 이름, 종목코드로 검색해 보세요' : '기업 검색'
          }
          aria-label="기업 검색"
          aria-autocomplete="list"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-activedescendant={showPanel && activeIndex >= 0 ? optionId(activeIndex) : undefined}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          enterKeyHint="search"
          autoComplete="off"
          autoFocus={autoFocus}
        />
        {query && (
          <button
            type="button"
            className={styles.clear}
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            aria-label="검색어 지우기"
          >
            <Icon name="close" size={14} />
          </button>
        )}
      </div>

      {showPanel && (
        <div className={styles.panel}>
          {!isSearching && (
            <div className={styles.panelHead}>
              <span>최근 검색</span>
              <button type="button" className={styles.textButton} onClick={recent.clear}>
                모두 지우기
              </button>
            </div>
          )}

          {isSearching && options.length === 0 ? (
            <p className={styles.empty} role="status">
              {isWaiting
                ? '찾고 있어요…'
                : `‘${trimmed}’에 맞는 기업을 찾지 못했어요. 이름이나 종목코드를 다시 확인해 주세요`}
            </p>
          ) : (
            <ul
              id={listId}
              role="listbox"
              aria-label={isSearching ? '검색 결과' : '최근 검색'}
              className={styles.list}
            >
              {options.map((option, index) => (
                <li
                  key={option.company.stock_code}
                  id={optionId(index)}
                  role="option"
                  aria-selected={index === activeIndex}
                  className={`${styles.option} ${index === activeIndex ? styles.active : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => select(option)}
                >
                  {option.kind === 'result' ? (
                    <ResultRow company={option.company} keyword={trimmed} />
                  ) : (
                    <>
                      <Icon name="search" size={16} className={styles.recentIcon} />
                      <span className={styles.recentName}>{option.company.name}</span>
                      <span className={styles.code}>{option.company.stock_code}</span>
                      <button
                        type="button"
                        className={styles.remove}
                        aria-label={`최근 검색에서 ${option.company.name} 지우기`}
                        onClick={(e) => {
                          e.stopPropagation();
                          recent.remove(option.company.stock_code);
                        }}
                      >
                        <Icon name="close" size={12} />
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function ResultRow({ company, keyword }: { company: CompanySummary; keyword: string }) {
  return (
    <>
      <CompanyAvatar name={company.name} code={company.stock_code} size={36} />
      <span className={styles.info}>
        <span className={styles.name}>
          <HighlightText text={company.name} keyword={keyword} />
        </span>
        <span className={styles.meta}>
          <HighlightText text={company.name_en} keyword={keyword} /> ·{' '}
          <HighlightText text={company.stock_code} keyword={keyword} />
        </span>
      </span>
      <span className={styles.tags}>
        <span className={styles.sector}>{company.sector}</span>
        <span className={styles.market}>{marketLabel[company.market]}</span>
      </span>
    </>
  );
}
