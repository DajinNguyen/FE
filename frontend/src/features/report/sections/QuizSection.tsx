import { Section } from '../../../components/Section';
import { Quiz } from '../../quiz/Quiz';
import type { ReportSectionProps } from '../sectionTypes';

export const QUIZ_ANCHOR_ID = 'report-quiz';

export function QuizSection({ report }: ReportSectionProps) {
  return (
    <Section
      id={QUIZ_ANCHOR_ID}
      title="퀴즈로 확인해요"
      description="리포트에 나온 숫자로만 냈어요"
    >
      <Quiz questions={report.quiz} />
    </Section>
  );
}
