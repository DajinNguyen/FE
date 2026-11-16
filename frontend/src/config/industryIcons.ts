import {
  Anvil,
  BatteryCharging,
  Bot,
  BrainCircuit,
  Building2,
  Car,
  CircuitBoard,
  Clapperboard,
  CodeXml,
  Cog,
  Cpu,
  Dna,
  Factory,
  FlaskConical,
  Gamepad2,
  Globe,
  GraduationCap,
  HardHat,
  Landmark,
  Monitor,
  Plane,
  RadioTower,
  Shield,
  Ship,
  Shirt,
  ShoppingCart,
  Sparkles,
  Stethoscope,
  Truck,
  UtensilsCrossed,
  Zap,
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
  // 기업 2,000곳으로 늘리며 추가된 산업 20개 (백엔드 industries.json 의 icon_key)
  display: Monitor,
  electronics: CircuitBoard,
  robot: Bot,
  machinery: Cog,
  energy: Zap,
  chemical: FlaskConical,
  steel: Anvil,
  construction: HardHat,
  medical: Stethoscope,
  beauty: Sparkles,
  food: UtensilsCrossed,
  retail: ShoppingCart,
  fashion: Shirt,
  software: CodeXml,
  telecom: RadioTower,
  entertainment: Clapperboard,
  travel: Plane,
  transport: Truck,
  education: GraduationCap,
  holding: Building2,
};

export const industryIcon = (key: string): LucideIcon => INDUSTRY_ICONS[key] ?? Factory;

/**
 * 산업 색 (배경·아이콘). 값은 tokens.css 의 --ind-{키}-bg / -fg (라이트·다크 모두 대비 4.5:1 이상).
 * 모르는 산업은 연한 브랜드 톤으로 보여줘요.
 */
export const industryColorStyle = (key: string) => {
  const known = key in INDUSTRY_ICONS;
  return {
    '--industry-bg': known ? `var(--ind-${key}-bg)` : 'var(--brand-weak)',
    '--industry-fg': known ? `var(--ind-${key}-fg)` : 'var(--brand)',
  } as CSSProperties;
};
