import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getUserBookings,
  createBooking,
  updateBooking,
  cancelBooking,
  deleteBooking,
  getBookingById,
} from './api'
import type { UpdateBookingData } from './types'

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
      // Invalidate and refetch bookings list
      queryClient.invalidateQueries({ queryKey: ['userBookings'] })
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
      // Invalidate both the list and the individual booking
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
