import { apiClient } from '@/services/apiClient';

export interface DashboardStats {
  total_lockers: number;
  available_lockers: number;
  occupied_lockers: number;
  maintenance_lockers: number;
  total_bookings: number;
  active_bookings: number;
  pending_requests: number;
  total_users: number;
}

export interface FloorUtilization {
  floor_id: string;
  floor_number: string;
  total_lockers: number;
  available: number;
  occupied: number;
  maintenance: number;
  utilization_rate: number;
}

export interface RecentActivity {
  notification_id: string;
  user_id: string | null;
  user_name: string | null;
  entity_type: string;
  title: string;
  caption: string | null;
  type: string;
  created_at: string;
}

export interface RecentActivityResponse {
  activities: RecentActivity[];
}

export interface FloorUtilizationResponse {
  floors: FloorUtilization[];
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  return apiClient.get<DashboardStats>('/admin/dashboard/stats');
}

/**
 * Get utilization for all floors
 */
export async function getFloorsUtilization(): Promise<FloorUtilizationResponse> {
  return apiClient.get<FloorUtilizationResponse>('/admin/dashboard/floors/utilization');
}

/**
 * Get recent activity
 */
export async function getRecentActivity(): Promise<RecentActivityResponse> {
  return apiClient.get<RecentActivityResponse>('/admin/dashboard/recent-activity');
}
