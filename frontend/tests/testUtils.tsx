import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router';
import { AppProviders } from '../src/AppProviders';
import type { AuthUser } from '../src/features/auth/AuthContext';
import { createQueryClient } from '../src/queryClient';

/** 실제 앱과 같은 Provider(Query, Toast, Auth, TermSheet)로 감싸서 렌더링해요. */
export function renderWithProviders(
  ui: ReactElement,
  { route = '/', user = null }: { route?: string; user?: AuthUser | null } = {},
) {
  const queryClient = createQueryClient();
  queryClient.setDefaultOptions({ queries: { retry: false } });
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AppProviders queryClient={queryClient} initialUser={user}>
        {ui}
      </AppProviders>
    </MemoryRouter>,
  );
}
