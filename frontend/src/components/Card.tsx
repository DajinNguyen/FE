import type { ElementType, ReactNode } from 'react';
import styles from './Card.module.css';

interface CardProps {
  children: ReactNode;
  tone?: 'gray' | 'brand' | 'brandWeak' | 'plain';
  as?: ElementType;
  className?: string;
}

export function Card({ children, tone = 'gray', as: Tag = 'div', className }: CardProps) {
  return (
    <Tag className={[styles.card, styles[tone], className].filter(Boolean).join(' ')}>
      {children}
    </Tag>
  );
}
