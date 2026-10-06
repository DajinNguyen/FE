import type { ComponentType } from 'react';
import type { ReportSectionProps } from './sectionTypes';
import { KeyPointsSection } from './sections/KeyPointsSection';
import { ChartsSection } from './sections/ChartsSection';
import { ConnectionSection } from './sections/ConnectionSection';
import { ProsConsSection } from './sections/ProsConsSection';
import { DetailLinksSection } from './sections/DetailLinksSection';
import { QuizSection } from './sections/QuizSection';
import { DisclaimerSection } from './sections/DisclaimerSection';

/**
 * AI 리포트 섹션 순서. (맨 위 "AI 한 줄 요약"은 생성 과정을 보여줘야 해서 ReportTab 이 직접 그려요.)
 * 섹션을 추가하거나 순서를 바꾸려면 이 배열만 고치면 돼요.
 */
export const reportSections: { id: string; Component: ComponentType<ReportSectionProps> }[] = [
  { id: 'key-points', Component: KeyPointsSection },
  { id: 'charts', Component: ChartsSection },
  { id: 'connection', Component: ConnectionSection },
  { id: 'pros-cons', Component: ProsConsSection },
  { id: 'details', Component: DetailLinksSection },
  { id: 'quiz', Component: QuizSection },
  { id: 'disclaimer', Component: DisclaimerSection },
];
