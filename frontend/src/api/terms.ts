import { loadMockServer, request } from './client';
import type { Term } from '../types';

export function getTerms() {
  return request<Term[]>({
    path: '/api/terms',
    mock: async () => (await loadMockServer()).getTerms(),
  });
}
