import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { ToastProvider } from './components/ToastProvider';
import { TermSheetProvider } from './components/TermSheetProvider';
import { AuthProvider } from './features/auth/AuthProvider';
import type { AuthUser } from './features/auth/AuthContext';
import { LoginSheetProvider } from './features/auth/LoginSheetProvider';
import { TermProgressProvider } from './hooks/useTermProgress';
import { UsageCreditsProvider } from './hooks/useUsageCredits';
import { createQueryClient } from './queryClient';

export function AppProviders({
  children,
  queryClient,
  initialUser,
}: {
  children: ReactNode;
  queryClient?: QueryClient;
  /** 테스트에서 로그인한 상태로 시작할 때 */
  initialUser?: AuthUser | null;
}) {
  const [client] = useState(() => queryClient ?? createQueryClient());
  return (
    <QueryClientProvider client={client}>
      <ToastProvider>
        <AuthProvider initialUser={initialUser}>
          <TermProgressProvider>
            <UsageCreditsProvider>
              <LoginSheetProvider>
                <TermSheetProvider>{children}</TermSheetProvider>
              </LoginSheetProvider>
            </UsageCreditsProvider>
          </TermProgressProvider>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
