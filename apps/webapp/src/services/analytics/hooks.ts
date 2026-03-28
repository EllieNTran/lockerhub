import { useQuery } from '@tanstack/react-query';
import { getLockerUsage } from './index';
import type { GetLockerUsageParams } from './index';
import type { LockerUsageData } from '@/types/analytics';

export const useLockerUsage = (params: GetLockerUsageParams = {}) =>
  useQuery<LockerUsageData[]>({
    queryKey: ['lockerUsage', params],
    queryFn: () => getLockerUsage(params),
  });
