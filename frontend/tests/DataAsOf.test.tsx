import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DataAsOf } from '../src/components/DataAsOf';

describe('데이터 기준일', () => {
  it('장 마감 시각이면 "장 마감 기준", 날짜만 있으면 "10월 16일 기준"으로 보여줘요', () => {
    const { rerender } = render(<DataAsOf value="2026-10-16 15:30" />);
    expect(screen.getByText('10월 16일 장 마감 기준')).toBeInTheDocument();

    rerender(<DataAsOf value="2026-10-16" />);
    expect(screen.getByText('10월 16일 기준')).toBeInTheDocument();
  });

  it('날짜가 아닌 값은 그대로, 여러 기준은 · 로 이어서 보여주고 빈 값은 빼요', () => {
    render(
      <DataAsOf
        items={[
          { label: '재무', value: '2025년 사업보고서' },
          { label: '주가', value: '2026-10-05' },
          { label: '뉴스', value: null },
        ]}
        prefix="이 리포트는"
        suffix="기준 자료로 만들었어요."
      />,
    );
    expect(
      screen.getByText(
        '이 리포트는 재무 2025년 사업보고서 · 주가 10월 5일 기준 자료로 만들었어요.',
      ),
    ).toBeInTheDocument();
  });

  it('값이 없으면 아무것도 그리지 않아요', () => {
    const { container } = render(<DataAsOf value={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
