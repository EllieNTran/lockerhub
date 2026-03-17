import { apiClient } from '@/services/apiClient';
import type { Notification } from '@/types/notification';

export interface GetNotificationsResponse {
  notifications: Notification[];
  unread: number;
}

export interface CreateNotificationData {
  user_id: string;
  title: string;
  caption?: string;
  entity_type?: 'booking' | 'locker' | 'key' | 'request' | 'floor' | 'booking_rule';
  type?: 'info' | 'warning' | 'error' | 'success';
  scope?: 'user' | 'department' | 'floor' | 'global';
}

export interface UpdateNotificationData {
  read?: boolean;
}

/**
 * Get all notifications for a user
 */
export async function getUserNotifications(userId: string, unreadOnly?: boolean): Promise<GetNotificationsResponse> {
  const params = new URLSearchParams();
  if (unreadOnly) {
    params.append('unreadOnly', 'true');
  }

  const queryString = params.toString();
  return apiClient.get<GetNotificationsResponse>(
    `/notifications/user/${userId}${queryString ? `?${queryString}` : ''}`
  );
}

/**
 * Mark notification as read for a user
 */
export async function markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
  return apiClient.put<void>(`/notifications/${notificationId}/read`, { userId });
}
