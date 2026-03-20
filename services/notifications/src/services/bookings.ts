import sendEmail from '../utils/send-email'
import { createNotification } from './notifications'
import { fromEnv } from '../constants'

const WEBAPP_URL = fromEnv('WEBAPP_URL') || 'http://localhost:3001'
const ADMIN_EMAIL = 'fm@lockerhub.com'

interface BookingEmailData {
  name: string
  lockerNumber: string
  floorNumber: string
  startDate?: string
  endDate: string
}

const sendBookingEmails = async (
  userEmail: string,
  baseData: BookingEmailData,
  userTemplateId: string,
  adminTemplateId: string,
  userSubject: string,
  adminSubject: string,
  userExtraData: Record<string, string | number> = {},
  adminExtraData: Record<string, string | number> = {},
): Promise<void> => {
  const commonData = {
    LOCKER_NUMBER: baseData.lockerNumber,
    FLOOR: baseData.floorNumber,
    START_DATE: baseData.startDate || '',
    END_DATE: baseData.endDate,
  }

  await Promise.all([
    sendEmail(userEmail, { NAME: baseData.name, ...commonData, ...userExtraData }, userTemplateId, userSubject),
    sendEmail(ADMIN_EMAIL, { USER_NAME: baseData.name, USER_EMAIL: userEmail, ...commonData, ...adminExtraData }, adminTemplateId, adminSubject),
  ])
}

export const notifyBookingConfirmation = async (
  userId: string,
  email: string,
  name: string,
  lockerNumber: string,
  floorNumber: string,
  startDate: string,
  endDate: string,
  userBookingsPath: string,
  adminBookingsPath: string,
): Promise<void> => {
  await createNotification({
    entityType: 'booking',
    title: 'Booking Confirmed',
    adminTitle: `Booking created for Locker ${lockerNumber}`,
    caption: `Your booking for Locker ${lockerNumber} on Floor ${floorNumber} from ${startDate} to ${endDate} has been confirmed.`,
    type: 'info',
    scope: 'user',
    userIds: [userId],
    createdBy: userId,
  })

  await sendBookingEmails(
    email,
    { name, lockerNumber, floorNumber, startDate, endDate },
    'locker-booking-confirmation-user',
    'locker-booking-confirmation-admin',
    'User Booking Confirmation',
    'Admin Booking Confirmation',
    { BOOKINGS_LINK: `${WEBAPP_URL}${userBookingsPath}` },
    { ADMIN_BOOKINGS_LINK: `${WEBAPP_URL}${adminBookingsPath}` },
  )
}

export const notifyBookingCancellation = async (
  userId: string,
  email: string,
  name: string,
  lockerNumber: string,
  floorNumber: string,
  startDate: string,
  endDate: string,
  keyStatus: string,
  keyNumber: string,
  adminBookingsPath: string,
): Promise<void> => {
  await createNotification({
    entityType: 'booking',
    title: 'Booking Cancelled',
    adminTitle: `Booking cancelled for Locker ${lockerNumber}`,
    caption: `Your booking for Locker ${lockerNumber} on Floor ${floorNumber} from ${startDate} to ${endDate} has been cancelled.`,
    type: 'info',
    scope: 'user',
    userIds: [userId],
    createdBy: userId,
  })

  const hasKey = keyStatus === 'with_employee'
  const userMessage = hasKey
    ? `As you currently have key ${keyNumber} in your possession, please return it to the drop-off box on the 5th floor by the end of today. This will ensure the locker is available for other users. Thank you for your cooperation.`
    : 'No further action is required on your part. If you have any questions or concerns, please feel free to contact Facilities Management.'

  const adminMessage = hasKey
    ? `User ${name} currently has key ${keyNumber} in their possession. Check if it has been returned to the drop-off box on the 5th floor at the end of the day.`
    : 'As the key is not with the employee, no further action is required.'

  await sendBookingEmails(
    email,
    { name, lockerNumber, floorNumber, startDate, endDate },
    'locker-booking-cancellation-user',
    'locker-booking-cancellation-admin',
    'User Booking Cancellation',
    'Admin Booking Cancellation',
    { MESSAGE: userMessage },
    { MESSAGE: adminMessage, ADMIN_BOOKINGS_LINK: adminBookingsPath },
  )
}

export const notifyBookingExtension = async (
  userId: string,
  email: string,
  name: string,
  lockerNumber: string,
  floorNumber: string,
  originalEndDate: string,
  newEndDate: string,
  userBookingsPath: string,
  adminBookingsPath: string,
): Promise<void> => {
  await createNotification({
    entityType: 'booking',
    title: 'Booking Extended',
    adminTitle: `Booking extended for Locker ${lockerNumber}`,
    caption: `Your booking for Locker ${lockerNumber} has been extended until ${newEndDate}.`,
    type: 'success',
    scope: 'user',
    userIds: [userId],
    createdBy: userId,
  })

  await sendBookingEmails(
    email,
    { name, lockerNumber, floorNumber, endDate: newEndDate },
    'extended-locker-booking-user',
    'extended-locker-booking-admin',
    'Booking Extension',
    'Booking Extension',
    { ORIGINAL_END_DATE: originalEndDate, NEW_END_DATE: newEndDate, BOOKINGS_LINK: `${WEBAPP_URL}${userBookingsPath}` },
    { ORIGINAL_END_DATE: originalEndDate, NEW_END_DATE: newEndDate, ADMIN_BOOKINGS_LINK: `${WEBAPP_URL}${adminBookingsPath}` },
  )
}

export const notifyKeyReturnReminder = async (
  userId: string,
  email: string,
  name: string,
  lockerNumber: string,
  floorNumber: string,
  startDate: string,
  endDate: string,
  keyReturnPath: string,
): Promise<void> => {
  await createNotification({
    entityType: 'key',
    title: 'Key Return Due Today',
    adminTitle: `Key return reminder for Locker ${lockerNumber}`,
    caption: `The key for Locker ${lockerNumber} on Floor ${floorNumber} is due for return by ${endDate}.`,
    type: 'warning',
    scope: 'user',
    userIds: [userId],
    createdBy: null,
  })

  await sendEmail(
    email,
    { NAME: name, LOCKER_NUMBER: lockerNumber, FLOOR: floorNumber, START_DATE: startDate, END_DATE: endDate, KEY_RETURN_LINK: keyReturnPath },
    'key-return-reminder-user',
    'Key Return Reminder',
  )
}
