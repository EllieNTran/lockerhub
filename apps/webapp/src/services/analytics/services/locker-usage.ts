import { apiClient } from '@/services/apiClient';
import type { LockerUsageData } from '@/types/analytics';

export type Period =
  | 'today'
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

/**
 * Get locker usage analytics data for a specified period.
 */
export async function getLockerUsage({
  period = 'last_month',
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
