import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { ToastProvider } from './components/ToastProvider';
import { TermSheetProvider } from './components/TermSheetProvider';
import { AuthProvider } from './features/auth/AuthProvider';
import { createQueryClient } from './queryClient';

export function AppProviders({
  children,
  queryClient,
}: {
  children: ReactNode;
  queryClient?: QueryClient;
}) {
  const [client] = useState(() => queryClient ?? createQueryClient());
  return (
    <QueryClientProvider client={client}>
      <ToastProvider>
        <AuthProvider>
          <TermSheetProvider>{children}</TermSheetProvider>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
