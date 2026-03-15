import { apiClient } from '@/services/apiClient';
import type { Locker } from '@/types/locker';

export interface LockerStats {
  total: number;
  available: number;
  occupied: number;
  maintenance: number;
  by_floor: {
    floor_id: string;
    floor_number: string;
    total: number;
    available: number;
    occupied: number;
    maintenance: number;
  }[];
}

/**
 * Get all lockers
 */
export async function getAllLockers(): Promise<Locker[]> {
  const response = await apiClient.get<{ lockers: Locker[] }>('/admin/lockers');
  return response.lockers;
}

/**
 * Get locker availability stats
 */
export async function getLockerStats(): Promise<LockerStats> {
  return apiClient.get<LockerStats>('/admin/lockers/stats');
}

/**
 * Mark locker as maintenance
 */
export async function markLockerMaintenance(lockerId: string): Promise<Locker> {
  return apiClient.put<Locker>(`/admin/lockers/${lockerId}/maintenance`);
}

/**
 * Mark locker as available
 */
export async function markLockerAvailable(lockerId: string): Promise<Locker> {
  return apiClient.put<Locker>(`/admin/lockers/${lockerId}/available`);
}

/**
 * Update locker coordinates (zone-relative)
 */
export async function updateLockerCoordinates(
  lockerId: string,
  x_coordinate: number,
  y_coordinate: number
): Promise<{ locker_id: string; locker_number: string; x_coordinate: number; y_coordinate: number }> {
  return apiClient.patch(`/admin/lockers/${lockerId}/coordinates`, {
    x_coordinate,
    y_coordinate,
  });
}
