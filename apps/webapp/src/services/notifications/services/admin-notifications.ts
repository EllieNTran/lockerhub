import { apiClient } from '@/services/apiClient';
import { getUserIdFromToken } from '@/services/auth/services/tokens';

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

/**
 * Send overdue key return reminder notification
 */
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
