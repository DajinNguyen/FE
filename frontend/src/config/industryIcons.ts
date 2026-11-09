import {
  BatteryCharging,
  BrainCircuit,
  Car,
  Cpu,
  Dna,
  Factory,
  Gamepad2,
  Globe,
  Landmark,
  Shield,
  Ship,
  type LucideIcon,
} from 'lucide-react';
import type { CSSProperties } from 'react';

/** 산업 아이콘 매핑 (서버의 icon_key → 선 아이콘). 모르는 값이면 공장 아이콘을 써요. */
export const INDUSTRY_ICONS: Record<string, LucideIcon> = {
  ai: BrainCircuit,
  semiconductor: Cpu,
  battery: BatteryCharging,
  bio: Dna,
  internet: Globe,
  auto: Car,
  shipbuilding: Ship,
  defense: Shield,
  finance: Landmark,
  game: Gamepad2,
};

export const industryIcon = (key: string): LucideIcon => INDUSTRY_ICONS[key] ?? Factory;

/**
 * 산업 TOP 3 카드 색 (배경·아이콘). 값은 tokens.css 의 --ind-{키}-bg / -fg.
 * 모르는 산업은 연한 브랜드 톤으로 보여줘요.
 */
export const industryColorStyle = (key: string) => {
  const known = key in INDUSTRY_ICONS;
  return {
    '--industry-bg': known ? `var(--ind-${key}-bg)` : 'var(--brand-weak)',
    '--industry-fg': known ? `var(--ind-${key}-fg)` : 'var(--brand)',
  } as CSSProperties;
};
