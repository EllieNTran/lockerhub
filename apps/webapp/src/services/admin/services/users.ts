import { apiClient } from '@/services/apiClient';
import type { User } from '@/types/user';

/**
 * Get all users
 */
export async function getAllUsers(): Promise<User[]> {
  const response = await apiClient.get<{ users: User[] }>('/admin/users');
  return response.users;
}

/**
 * Get a user by their ID
 */
export async function getUser(user_id: string): Promise<User> {
  return apiClient.get<User>(`/admin/users/${user_id}`);
}
