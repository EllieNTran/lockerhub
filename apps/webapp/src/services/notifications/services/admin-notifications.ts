import { apiClient } from '@/services/apiClient';
import { getUserIdFromToken } from '@/services/auth/services/tokens';
import type { EntityType, NotificationScope, NotificationType } from '@/types/notification';

export interface SendOverdueKeyReturnReminderRequest {
  userId: string;
  email: string;
  name: string;
  lockerNumber: string;
  floorNumber: string;
  startDate: string;
  endDate: string;
  keyNumber: string;
  keyReturnPath: string;
}

export interface SendOverdueKeyReturnReminderResponse {
  success: boolean;
  message: string;
}

export interface SendNotificationRequest {
  title: string
  adminTitle?: string
  caption?: string
  type?: NotificationType
  entityType?: EntityType
  scope: NotificationScope
  userIds?: string[]
  departmentId?: string
  floorId?: string
}

export async function sendOverdueKeyReturnReminder(
  data: SendOverdueKeyReturnReminderRequest
): Promise<SendOverdueKeyReturnReminderResponse> {
  const adminId = getUserIdFromToken();

  if (!adminId) {
    throw new Error('Admin ID not found in token');
  }

  return apiClient.post<SendOverdueKeyReturnReminderResponse>(
    '/notifications/booking/overdue-key-return',
    {
      adminId,
      ...data,
    }
  );
}

export async function sendNotification(data: SendNotificationRequest) {
  const adminId = getUserIdFromToken();

  if (!adminId) {
    throw new Error('Admin ID not found in token');
  }

  return apiClient.post('/notifications', {
    createdBy: adminId,
    ...data,
  });
}
