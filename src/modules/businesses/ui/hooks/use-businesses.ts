import { useQuery } from '@tanstack/react-query';

import { getBusinessesAction } from '@/modules/businesses/server/actions/get-businesses.action';

export const businessKeys = {
  all: ['businesses'] as const,
};

export function useBusinesses() {
  return useQuery({
    queryKey: businessKeys.all,
    queryFn: () => getBusinessesAction(),
  });
}
