import { z } from 'zod'

export const passwordResetSchema = z.object({
  email: z.email(),
  name: z.string().min(1),
  resetLink: z.url(),
})

export const activationSchema = z.object({
  email: z.email(),
  name: z.string().min(1),
  activationLink: z.url(),
})

export const createNotificationSchema = z.object({
  title: z.string().min(1),
  adminTitle: z.string().optional(),
  caption: z.string().optional(),
  type: z.enum(['info', 'success', 'warning', 'error']).optional(),
  entityType: z.string().optional(),
  scope: z.enum(['user', 'department', 'floor', 'global']),
  createdBy: z.uuid().nullable().optional(),
  userIds: z.array(z.uuid()).optional(),
  departmentId: z.uuid().optional(),
  floorId: z.uuid().optional(),
})

export const markAsReadSchema = z.object({
  userId: z.uuid(),
})

export const bookingConfirmationSchema = z.object({
  userId: z.uuid(),
  email: z.email(),
  name: z.string().min(1),
  lockerNumber: z.string().min(1),
  floorNumber: z.string().min(1),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  userBookingsPath: z.string().min(1),
  adminBookingsPath: z.string().min(1),
})

export const bookingCancellationSchema = z.object({
  userId: z.uuid(),
  email: z.email(),
  name: z.string().min(1),
  lockerNumber: z.string().min(1),
  floorNumber: z.string().min(1),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  keyStatus: z.string().min(1),
  keyNumber: z.string().min(1),
  adminBookingsPath: z.string().min(1),
})

export const bookingExtensionSchema = z.object({
  userId: z.uuid(),
  email: z.email(),
  name: z.string().min(1),
  lockerNumber: z.string().min(1),
  floorNumber: z.string().min(1),
  originalEndDate: z.iso.date(),
  newEndDate: z.iso.date(),
  userBookingsPath: z.string().min(1),
  adminBookingsPath: z.string().min(1),
})

export const keyReturnSchema = z.object({
  userId: z.uuid(),
  email: z.email(),
  name: z.string().min(1),
  lockerNumber: z.string().min(1),
  floorNumber: z.string().min(1),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  keyReturnPath: z.string().min(1),
})

export const waitlistJoinedSchema = z.object({
  userId: z.uuid(),
  email: z.email(),
  name: z.string().min(1),
  floorNumber: z.string().min(1),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
})

export const waitlistRemovedSchema = z.object({
  userId: z.uuid(),
  email: z.email(),
  name: z.string().min(1),
  floorNumber: z.string().min(1),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
})
