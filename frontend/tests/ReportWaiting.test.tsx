import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RegenerateProgress, ReportWaiting } from '../src/features/analysis/ReportWaiting';

const currentStep = () =>
  within(screen.getByRole('list', { name: '리포트 생성 단계' }))
    .getAllByRole('listitem')
    .find((item) => item.textContent?.includes('진행 중'));

describe('리포트 생성 대기 화면', () => {
  it('처음 만들 때는 단계·경과 시간·예상 시간을 보여주고, 시간에 따라 단계가 넘어가요', () => {
    render(<ReportWaiting startedAt={Date.now() - 8_000} onCancel={vi.fn()} />);

    expect(screen.getByText(/보통 15초 정도 걸려요 · 8초 지났어요/)).toBeInTheDocument();
    expect(currentStep()).toHaveTextContent('기업 비전 읽기');
  });

  it('예상 시간이 지나도 마지막 단계에서 멈춰 기다려요', () => {
    render(<ReportWaiting startedAt={Date.now() - 60_000} onCancel={vi.fn()} />);
    expect(currentStep()).toHaveTextContent('핵심 포인트 정리');
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '95');
  });

  it('서버가 단계를 알려주면(activeStep) 시간 대신 그 단계를 보여줘요', () => {
    render(<ReportWaiting startedAt={Date.now()} onCancel={vi.fn()} activeStep={1} />);
    expect(currentStep()).toHaveTextContent('뉴스 확인');
  });

  it('다시 만들 때는 진행 표시줄만 보여주고, 취소할 수 있어요', async () => {
    const onCancel = vi.fn();
    render(<RegenerateProgress startedAt={Date.now()} onCancel={onCancel} />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: '리포트 생성 단계' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(onCancel).toHaveBeenCalled();
  });
});
