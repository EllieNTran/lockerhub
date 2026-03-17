import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDashboardStats,
  getFloorsUtilization,
  getRecentActivity,
  createAdminBooking,
  getAllBookings,
  cancelBooking,
  confirmHandover,
  confirmReturn,
  getAllLockers,
  getLockerStats,
  markLockerMaintenance,
  reportLostKey,
  orderReplacementKey,
  markLockerAvailable,
  updateLockerCoordinates,
  getAllSpecialRequests,
  reviewSpecialRequest,
  getBookingRules,
  updateBookingRules,
  updateFloorStatus,
  getAuditLogs,
  getAllUsers,
  getUser,
} from './index';
import type {
  CreateAdminBookingData,
  HandoverData,
  ReturnData,
  ReviewRequestData,
  UpdateBookingRuleData,
  UpdateFloorStatusData,
  GetAuditLogsParams,
} from './index';

// Dashboard Hooks
export const useDashboardStats = () =>
  useQuery({
    queryKey: ['dashboardStats'],
    queryFn: getDashboardStats,
    staleTime: 30 * 1000, // 30 seconds
  });

export const useFloorsUtilization = () =>
  useQuery({
    queryKey: ['floorsUtilization'],
    queryFn: getFloorsUtilization,
    staleTime: 30 * 1000,
  });

export const useRecentActivity = () =>
  useQuery({
    queryKey: ['recentActivity'],
    queryFn: getRecentActivity,
    staleTime: 30 * 1000,
  });

// Bookings Hooks
export const useAllBookings = () =>
  useQuery({
    queryKey: ['adminBookings'],
    queryFn: getAllBookings,
  });

export const useCreateAdminBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateAdminBookingData) => createAdminBooking(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
};

export const useCancelBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (bookingId: string) => cancelBooking(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
};

export const useConfirmHandover = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ bookingId, data }: { bookingId: string; data: HandoverData }) =>
      confirmHandover(bookingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBookings'] });
      queryClient.invalidateQueries({ queryKey: ['recentActivity'] });
    },
  });
};

export const useConfirmReturn = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ bookingId, data }: { bookingId: string; data: ReturnData }) =>
      confirmReturn(bookingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['recentActivity'] });
    },
  });
};

// Lockers Hooks
export const useAllLockers = () =>
  useQuery({
    queryKey: ['adminLockers'],
    queryFn: getAllLockers,
  });

export const useLockerStats = () =>
  useQuery({
    queryKey: ['lockerStats'],
    queryFn: getLockerStats,
    staleTime: 30 * 1000,
  });

export const useMarkLockerMaintenance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (lockerId: string) => markLockerMaintenance(lockerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLockers'] });
      queryClient.invalidateQueries({ queryKey: ['lockerStats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
};

export const useReportLostKey = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (lockerId: string) => reportLostKey(lockerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLockers'] });
      queryClient.invalidateQueries({ queryKey: ['lockerStats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
};

export const useOrderReplacementKey = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (lockerId: string) => orderReplacementKey(lockerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLockers'] });
      queryClient.invalidateQueries({ queryKey: ['lockerStats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
};

export const useMarkLockerAvailable = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (lockerId: string) => markLockerAvailable(lockerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLockers'] });
      queryClient.invalidateQueries({ queryKey: ['lockerStats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
};

export const useUpdateLockerCoordinates = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ lockerId, x_coordinate, y_coordinate }: { lockerId: string; x_coordinate: number; y_coordinate: number }) =>
      updateLockerCoordinates(lockerId, x_coordinate, y_coordinate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLockers'] });
    },
  });
};

// Special Requests Hooks
export const useAllSpecialRequests = () =>
  useQuery({
    queryKey: ['adminSpecialRequests'],
    queryFn: getAllSpecialRequests,
  });

export const useReviewSpecialRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ requestId, data }: { requestId: string; data: ReviewRequestData }) =>
      reviewSpecialRequest(requestId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSpecialRequests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['recentActivity'] });
    },
  });
};

// Booking Rules Hooks
export const useBookingRules = () =>
  useQuery({
    queryKey: ['bookingRules'],
    queryFn: getBookingRules,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

export const useUpdateBookingRules = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (rules: UpdateBookingRuleData[]) => updateBookingRules(rules),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookingRules'] });
    },
  });
};

export const useUpdateFloorStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ floorId, data }: { floorId: string; data: UpdateFloorStatusData }) =>
      updateFloorStatus(floorId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floorsUtilization'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
};

// Audit Logs Hooks
export const useAuditLogs = (params?: GetAuditLogsParams) =>
  useQuery({
    queryKey: ['auditLogs', params],
    queryFn: () => getAuditLogs(params),
    staleTime: 60 * 1000, // 1 minute
  });

// Users Hooks
export const useAllUsers = () =>
  useQuery({
    queryKey: ['adminUsers'],
    queryFn: getAllUsers,
  });

export const useUser = (user_id: string) =>
  useQuery({
    queryKey: ['adminUser', user_id],
    queryFn: () => getUser(user_id),
    enabled: !!user_id,
  });
