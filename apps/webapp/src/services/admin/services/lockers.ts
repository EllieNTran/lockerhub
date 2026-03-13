import { apiClient } from '@/services/apiClient';
import type { Locker } from '@/shared/types/locker';

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
  return apiClient.get<Locker[]>('/admin/lockers');
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
