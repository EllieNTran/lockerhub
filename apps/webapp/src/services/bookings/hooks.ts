import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getUserBookings,
  createBooking,
  updateBooking,
  extendBooking,
  cancelBooking,
  deleteBooking,
  getBookingById,
} from './services/user-bookings'
import { joinFloorQueue } from './services/waiting-list'
import { getFloors } from './services/floors'
import type { UpdateBookingData, ExtendBookingData } from './services/user-bookings'
import { getAvailableLockers } from './services/available-lockers'
import type { GetAvailableLockersParams } from './services/available-lockers'

/**
 * Fetch user's bookings
 */
export const useUserBookings = () =>
  useQuery({
    queryKey: ['userBookings'],
    queryFn: getUserBookings,
  })

/**
 * Fetch a single booking by ID
 */
export const useBooking = (bookingId: string) =>
  useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => getBookingById(bookingId),
    enabled: !!bookingId,
  })

/**
 * Create a new booking
 */
export const useCreateBooking = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userBookings'] })
      queryClient.invalidateQueries({ queryKey: ['userNotifications'] })
    },
  })
}

/**
 * Update an existing booking
 */
export const useUpdateBooking = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ bookingId, data }: { bookingId: string; data: UpdateBookingData }) =>
      updateBooking(bookingId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['userBookings'] })
      queryClient.invalidateQueries({ queryKey: ['booking', variables.bookingId] })
    },
  })
}

/**
 * Extend an existing booking
 */
export const useExtendBooking = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ bookingId, data }: { bookingId: string; data: ExtendBookingData }) =>
      extendBooking(bookingId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['userBookings'] })
      queryClient.invalidateQueries({ queryKey: ['booking', variables.bookingId] })
    },
  })
}

/**
 * Cancel a booking
 */
export const useCancelBooking = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: cancelBooking,
    onSuccess: (_data, bookingId) => {
      queryClient.invalidateQueries({ queryKey: ['userBookings'] })
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] })
    },
  })
}

/**
 * Delete a booking
 */
export const useDeleteBooking = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteBooking,
    onSuccess: (_data, bookingId) => {
      queryClient.invalidateQueries({ queryKey: ['userBookings'] })
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] })
    },
  })
}

/**
 * Fetch available lockers for a floor and date range
 */
export const useAvailableLockers = (params: GetAvailableLockersParams) =>
  useQuery({
    queryKey: ['availableLockers', params.floor_id, params.start_date, params.end_date],
    queryFn: () => getAvailableLockers(params),
    enabled: !!params.floor_id && !!params.start_date && !!params.end_date,
  })

/**
 * Fetch all open floors
 */
export const useFloors = () =>
  useQuery({
    queryKey: ['floors'],
    queryFn: getFloors,
  })

/**
 * Join a floor queue (waitlist)
 */
export const useJoinFloorQueue = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: joinFloorQueue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userNotifications'] })
    },
  })
}
