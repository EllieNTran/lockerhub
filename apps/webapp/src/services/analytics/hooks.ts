import { useQuery } from '@tanstack/react-query';
import { getLockerUsage, getTopDepartments, getMostPopularFloors } from './index';
import type { GetLockerUsageParams, GetTopDepartmentsParams, GetMostPopularFloorsParams } from './index';
import type { LockerUsageData, TopDepartmentData, MostPopularFloorData } from '@/types/analytics';

export const useLockerUsage = (params: GetLockerUsageParams = {}) =>
  useQuery<LockerUsageData[]>({
    queryKey: ['lockerUsage', params],
    queryFn: () => getLockerUsage(params),
  });

export const useTopDepartments = (params: GetTopDepartmentsParams = {}) =>
  useQuery<TopDepartmentData[]>({
    queryKey: ['topDepartments', params],
    queryFn: () => getTopDepartments(params),
  });

export const useMostPopularFloors = (params: GetMostPopularFloorsParams = {}) =>
  useQuery<MostPopularFloorData[]>({
    queryKey: ['mostPopularFloors', params],
    queryFn: () => getMostPopularFloors(params),
  });
