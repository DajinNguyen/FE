import { useId, useRef, useState } from 'react';
import { useCompanySearch } from '../hooks/useCompanySearch';
import { useOpenCompany } from '../hooks/useOpenCompany';
import type { CompanySummary } from '../types';
import { formatPrice } from '../utils/format';
import { CompanyAvatar } from './CompanyAvatar';
import { Icon } from './Icon';
import { PriceChange } from './PriceChange';
import styles from './HeaderSearch.module.css';

/** 상단 내비게이션의 작은 검색창. 어느 화면에서든 다른 회사를 바로 찾을 수 있어요. */
export function HeaderSearch() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const { data: results } = useCompanySearch(query);
  const openCompany = useOpenCompany();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const visible = open && query.trim().length > 0;
  const items = (results ?? []).slice(0, 6);

  const select = (company: CompanySummary) => {
    openCompany(company);
    if (company.has_report) {
      setQuery('');
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div
      className={styles.search}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <Icon name="search" size={18} className={styles.icon} />
      <input
        ref={inputRef}
        type="search"
        className={styles.input}
        placeholder="회사 검색"
        aria-label="상단 회사 검색"
        aria-expanded={visible}
        aria-controls={listId}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false);
          if (e.key === 'Enter' && items[0]) select(items[0]);
        }}
        autoComplete="off"
      />
      {visible && (
        <ul id={listId} className={styles.dropdown}>
          {items.length === 0 ? (
            <li className={styles.empty}>찾는 회사가 없어요</li>
          ) : (
            items.map((company) => (
              <li key={company.stock_code}>
                <button type="button" className={styles.item} onClick={() => select(company)}>
                  <CompanyAvatar name={company.name} code={company.stock_code} size={32} />
                  <span className={styles.name}>
                    {company.name}
                    <span className={styles.code}>{company.stock_code}</span>
                  </span>
                  <span className={styles.price}>
                    {formatPrice(company.current_price.value)}
                    <PriceChange rate={company.change_rate.value} />
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
