import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUserNotifications,
  markNotificationAsRead,
} from './services/user-notifications';
import {
  sendOverdueKeyReturnReminder,
  type SendOverdueKeyReturnReminderRequest,
  type SendNotificationRequest,
  sendNotification,
} from './services/admin-notifications';

/**
 * Fetch user's notifications
 */
export const useUserNotifications = (userId: string, unreadOnly?: boolean) =>
  useQuery({
    queryKey: ['userNotifications', userId, unreadOnly],
    queryFn: () => getUserNotifications(userId, unreadOnly),
    enabled: !!userId,
  });

/**
 * Mark notification as read
 */
export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, notificationId }: { userId: string; notificationId: string }) =>
      markNotificationAsRead(userId, notificationId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['userNotifications', variables.userId] });
    },
  });
};

/**
 * Send overdue key return reminder
 */
export const useSendOverdueKeyReturnReminder = () => {
  return useMutation({
    mutationFn: (data: SendOverdueKeyReturnReminderRequest) =>
      sendOverdueKeyReturnReminder(data),
  });
};

/**
 * Send a notification
 */
export const useSendNotification = () => {
  return useMutation({
    mutationFn: (data: SendNotificationRequest) => sendNotification(data),
  });
};
