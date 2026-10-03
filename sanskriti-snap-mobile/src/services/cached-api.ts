import { apiRequest } from './api';
import { queryClient } from './offline';

export function offlineFirstRequest<T>(path: string, queryKey: string[]) {
  return queryClient.fetchQuery({
    queryKey: ['offline', ...queryKey],
    queryFn: () => apiRequest<T>(path),
    staleTime: 5 * 60 * 1000,
  });
}
