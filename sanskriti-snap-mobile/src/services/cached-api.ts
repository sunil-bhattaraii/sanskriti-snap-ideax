import { apiRequest } from './api';
import { queryClient } from './offline';

export function offlineFirstRequest<T>(
  path: string,
  queryKey: string[],
  staleTime = 60 * 60 * 1000,
) {
  return queryClient.fetchQuery({
    queryKey: ['offline', ...queryKey],
    queryFn: () => apiRequest<T>(path),
    staleTime,
  });
}
