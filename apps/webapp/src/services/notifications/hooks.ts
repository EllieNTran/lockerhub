import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUserNotifications,
  markNotificationAsRead,
} from './services/user-notifications';

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
