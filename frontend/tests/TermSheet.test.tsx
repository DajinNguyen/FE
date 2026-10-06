import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { TermText } from '../src/components/TermText';
import { renderWithProviders } from './testUtils';

describe('TermSheet', () => {
  it('점선 밑줄 용어를 누르면 설명 시트가 열리고, "알겠어요"를 누르면 닫혀요', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <p>
        <TermText text="AI용 메모리 HBM이 잘 팔렸어요" />
      </p>,
    );

    const termButton = await screen.findByRole('button', { name: 'HBM' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(termButton);

    const dialog = await screen.findByRole('dialog', { name: 'HBM' });
    expect(dialog).toHaveTextContent(
      'AI 컴퓨터에 들어가는, 아주 빠르게 데이터를 주고받는 고성능 메모리예요.',
    );
    expect(dialog).toHaveTextContent('예를 들면');

    await user.click(screen.getByRole('button', { name: '알겠어요' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('Esc 키로도 닫을 수 있어요', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <p>
        <TermText text="부채비율이 낮아요" />
      </p>,
    );

    await user.click(await screen.findByRole('button', { name: '부채비율' }));
    expect(await screen.findByRole('dialog', { name: '부채비율' })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
