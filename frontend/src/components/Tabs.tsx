import styles from './Tabs.module.css';

export interface TabItem<T extends string> {
  id: T;
  label: string;
}

interface TabsProps<T extends string> {
  items: readonly TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  idPrefix: string;
}

export function Tabs<T extends string>({ items, value, onChange, idPrefix }: TabsProps<T>) {
  return (
    <div className={styles.tabs} role="tablist">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          id={`${idPrefix}-tab-${item.id}`}
          aria-selected={item.id === value}
          aria-controls={`${idPrefix}-panel-${item.id}`}
          className={styles.tab}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
