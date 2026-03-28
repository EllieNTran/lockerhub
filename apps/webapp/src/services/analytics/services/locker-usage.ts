import { apiClient } from '@/services/apiClient';
import type { LockerUsageData, TopDepartmentData, MostPopularFloorData } from '@/types/analytics';

export type Period =
  | 'last_7_days'
  | 'last_14_days'
  | 'last_month'
  | 'last_3_months'
  | 'last_6_months'
  | 'last_year'
  | 'last_2_years'
  | 'all_time';

export interface GetLockerUsageParams {
  period?: Period;
  floor_id?: string;
  department_id?: string;
}

export interface GetTopDepartmentsParams {
  period?: Period;
  floor_id?: string;
}

export interface GetMostPopularFloorsParams {
  period?: Period;
  department_id?: string;
}

/**
 * Get locker usage analytics data for a specified period optionally filtered by floor and/or department.
 */
export async function getLockerUsage({
  period = 'last_7_days',
  floor_id,
  department_id,
}: GetLockerUsageParams = {}): Promise<LockerUsageData[]> {
  const params = new URLSearchParams();
  params.append('period', period);
  if (floor_id) params.append('floor_id', floor_id);
  if (department_id) params.append('department_id', department_id);

  const response = await apiClient.get<{ locker_usage: LockerUsageData[] }>(
    `/analytics/locker-usage?${params.toString()}`
  );
  return response.locker_usage;
}

/**
 * Get top departments based on locker usage for a specified period, optionally filtered by floor.
 */
export async function getTopDepartments({
  period = 'last_7_days',
  floor_id,
}: GetTopDepartmentsParams = {}) {
  const params = new URLSearchParams();
  params.append('period', period);
  if (floor_id) params.append('floor_id', floor_id);

  const response = await apiClient.get<{ departments: TopDepartmentData[] }>(
    `/analytics/top-departments?${params.toString()}`
  );
  return response.departments;
}

/**
 * Get most popular floors based on locker usage for a specified period, optionally filtered by department.
 */
export async function getMostPopularFloors({
  period = 'last_7_days',
  department_id,
}: GetMostPopularFloorsParams = {}) {
  const params = new URLSearchParams();
  params.append('period', period);
  if (department_id) params.append('department_id', department_id);

  const response = await apiClient.get<{ floors: MostPopularFloorData[] }>(
    `/analytics/most-popular-floors?${params.toString()}`
  );
  return response.floors;
}
