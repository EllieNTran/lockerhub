import { apiClient } from '@/services/apiClient';

/**
 * Get list of departments
 */
export async function getDepartments(): Promise<Array<{ id: string; name: string }>> {
  const data = await apiClient.publicRequest<{
    departments: Array<{ id: string; name: string }>
  }>('/auth/metadata/departments', {
    method: 'GET',
  });
  return data.departments;
}

/**
 * Get list of office locations
 */
export async function getOffices(): Promise<string[]> {
  const data = await apiClient.publicRequest<{ offices: string[] }>('/auth/metadata/offices', {
    method: 'GET',
  });
  return data.offices;
}

/**
 * Validate staff number availability
 */
export async function validateStaffNumber(staffNumber: string): Promise<{
  available: boolean;
  message: string;
  requiresActivation?: boolean;
  email?: string;
}> {
  return apiClient.publicRequest<{
    available: boolean;
    message: string;
    requiresActivation?: boolean;
    email?: string;
  }>('/auth/metadata/validate-staff-number/' + staffNumber, {
    method: 'GET',
  });
}

/**
 * Check if account exists and its status
 */
export async function checkAccount(email: string): Promise<{
  exists: boolean;
  requiresActivation?: boolean;
  name?: string;
  email?: string;
  message: string;
}> {
  return apiClient.publicRequest<{
    exists: boolean;
    requiresActivation?: boolean;
    name?: string;
    email?: string;
    message: string;
  }>('/auth/metadata/check-account', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}
