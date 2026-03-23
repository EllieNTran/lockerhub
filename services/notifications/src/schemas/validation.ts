import { z } from 'zod'

export const passwordResetSchema = z.object({
  email: z.email(),
  name: z.string(),
  resetLink: z.url(),
})

export const activationSchema = z.object({
  email: z.email(),
  name: z.string(),
  activationLink: z.url(),
})

export const createNotificationSchema = z.object({
  title: z.string(),
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
  name: z.string(),
  lockerNumber: z.string(),
  floorNumber: z.string(),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  userBookingsPath: z.string(),
  adminBookingsPath: z.string(),
})

export const bookingCancellationSchema = z.object({
  userId: z.uuid(),
  email: z.email(),
  name: z.string(),
  lockerNumber: z.string(),
  floorNumber: z.string(),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  keyStatus: z.enum([
    'available',
    'awaiting_handover',
    'with_employee',
    'awaiting_return',
    'lost',
    'awaiting_replacement',
  ]),
  keyNumber: z.string(),
  adminBookingsPath: z.string(),
})

export const bookingExtensionSchema = z.object({
  userId: z.uuid(),
  email: z.email(),
  name: z.string(),
  lockerNumber: z.string(),
  floorNumber: z.string(),
  originalEndDate: z.iso.date(),
  newEndDate: z.iso.date(),
  userBookingsPath: z.string(),
  adminBookingsPath: z.string(),
})

export const keyReturnSchema = z.object({
  userId: z.uuid(),
  email: z.email(),
  name: z.string(),
  lockerNumber: z.string(),
  floorNumber: z.string(),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  keyNumber: z.string(),
  keyReturnPath: z.string(),
})

export const waitlistJoinedSchema = z.object({
  userId: z.uuid(),
  email: z.email(),
  name: z.string(),
  floorNumber: z.string(),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
})

export const waitlistRemovedSchema = z.object({
  userId: z.uuid(),
  email: z.email(),
  name: z.string(),
  floorNumber: z.string(),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
})

export const overdueKeyReturnSchema = z.object({
  adminId: z.uuid(),
  userId: z.uuid(),
  email: z.email(),
  name: z.string(),
  lockerNumber: z.string(),
  floorNumber: z.string(),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  keyNumber: z.string(),
  keyReturnPath: z.string(),
})
