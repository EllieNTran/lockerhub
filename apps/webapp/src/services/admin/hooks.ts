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
  createLocker,
  createLockerKey,
  getAllKeys,
  getAllFloors,
} from './index';
import type {
  CreateAdminBookingData,
  ReviewRequestData,
  UpdateBookingRulesData,
  GetAuditLogsParams,
  UpdateFloorStatusData,
} from './index';

// Dashboard Hooks
export const useDashboardStats = () =>
  useQuery({
    queryKey: ['dashboardStats'],
    queryFn: getDashboardStats,
  });

export const useFloorsUtilization = () =>
  useQuery({
    queryKey: ['floorsUtilization'],
    queryFn: getFloorsUtilization,
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
    mutationFn: ({ bookingId }: { bookingId: string }) =>
      confirmHandover(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBookings'] });
      queryClient.invalidateQueries({ queryKey: ['recentActivity'] });
    },
  });
};

export const useConfirmReturn = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ bookingId }: { bookingId: string }) =>
      confirmReturn(bookingId),
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

export const useCreateLocker = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ lockerNumber, floorId, keyNumber, location, x_coordinate, y_coordinate }: { lockerNumber: string; floorId: string; keyNumber: string; location?: string; x_coordinate?: number; y_coordinate?: number }) =>
      createLocker(lockerNumber, floorId, keyNumber, location, x_coordinate, y_coordinate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLockers'] });
      queryClient.invalidateQueries({ queryKey: ['lockerStats'] });
    },
  });
};

export const useCreateLockerKey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ lockerId, keyNumber }: { lockerId: string; keyNumber: string }) =>
      createLockerKey(lockerId, keyNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLockers'] });
      queryClient.invalidateQueries({ queryKey: ['lockerStats'] });
    },
  });
};

export const useAllKeys = () =>
  useQuery({
    queryKey: ['adminKeys'],
    queryFn: getAllKeys,
  });

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
  });

export const useUpdateBookingRules = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: UpdateBookingRulesData) => updateBookingRules(data),
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
      queryClient.invalidateQueries({ queryKey: ['adminFloors'] });
      queryClient.invalidateQueries({ queryKey: ['floors'] });
      queryClient.invalidateQueries({ queryKey: ['floorsUtilization'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['recentActivity'] });
    },
  });
};

export const useAllFloors = () =>
  useQuery({
    queryKey: ['adminFloors'],
    queryFn: getAllFloors,
  });

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
