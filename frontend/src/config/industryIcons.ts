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
