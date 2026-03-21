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
  return apiClient.post<Locker>(`/admin/lockers/${lockerId}/maintenance`);
}

/**
 * Report lost key and mark locker as maintenance
 */
export async function reportLostKey(lockerId: string): Promise<Locker> {
  return apiClient.post<Locker>(`/admin/lockers/${lockerId}/lost-key`);
}

/**
 * Order replacement key for locker
 */
export async function orderReplacementKey(lockerId: string): Promise<Locker> {
  return apiClient.post<Locker>(`/admin/lockers/${lockerId}/order-replacement-key`);
}

/**
 * Mark locker as available
 */
export async function markLockerAvailable(lockerId: string): Promise<Locker> {
  return apiClient.post<Locker>(`/admin/lockers/${lockerId}/available`);
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

/**
 * Create a new locker
 */
export async function createLocker(
  lockerNumber: string,
  floorId: string,
  keyNumber: string,
  location: string | undefined,
  x_coordinate: number | undefined,
  y_coordinate: number | undefined
): Promise<Locker> {
  return apiClient.post<Locker>('/admin/lockers', {
    locker_number: lockerNumber,
    floor_id: floorId,
    key_number: keyNumber,
    location,
    x_coordinate,
    y_coordinate,
  });
}

/**
 * Create a key for a locker
 */
export async function createLockerKey(
  lockerId: string,
  keyNumber: string
): Promise<{ key_id: string; key_number: string; locker_id: string }> {
  return apiClient.post('/admin/lockers/keys', {
    key_number: keyNumber,
    locker_id: lockerId,
  });
}

/**
 * Get all keys
 */
export async function getAllKeys(): Promise<{ key_id: string; key_number: string }[]> {
  const response = await apiClient.get<{ keys: { key_id: string; key_number: string }[] }>('/admin/lockers/keys');
  return response.keys;
}
