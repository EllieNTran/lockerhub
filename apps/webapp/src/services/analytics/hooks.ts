import { useQuery } from '@tanstack/react-query';
import { getLockerUsage, getTopDepartments, getMostPopularFloors } from './index';
import type { GetLockerUsageParams, GetTopDepartmentsParams, GetMostPopularFloorsParams } from './index';
import type { LockerUsageData, TopDepartmentData, MostPopularFloorData } from '@/types/analytics';

export const useLockerUsage = (params: GetLockerUsageParams = {}) =>
  useQuery<LockerUsageData[]>({
    queryKey: ['lockerUsage', params],
    queryFn: () => getLockerUsage(params),
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });

export const useTopDepartments = (params: GetTopDepartmentsParams = {}) =>
  useQuery<TopDepartmentData[]>({
    queryKey: ['topDepartments', params],
    queryFn: () => getTopDepartments(params),
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });

export const useMostPopularFloors = (params: GetMostPopularFloorsParams = {}) =>
  useQuery<MostPopularFloorData[]>({
    queryKey: ['mostPopularFloors', params],
    queryFn: () => getMostPopularFloors(params),
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });
