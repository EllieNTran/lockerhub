import sendEmail from '../utils/send-email'
import { createNotification } from './notifications'

const ADMIN_EMAIL = 'fm@lockerhub.com'

interface BookingEmailData {
  name: string
  lockerNumber: string
  floorNumber: number
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
  const emailData = {
    NAME: baseData.name,
    LOCKER_NUMBER: baseData.lockerNumber,
    FLOOR: baseData.floorNumber,
    START_DATE: baseData.startDate || '',
    END_DATE: baseData.endDate,
  }

  await Promise.all([
    sendEmail(
      userEmail,
      { ...emailData, ...userExtraData },
      userTemplateId,
      userSubject,
    ),
    sendEmail(
      ADMIN_EMAIL,
      { ...emailData, ...adminExtraData },
      adminTemplateId,
      adminSubject,
    ),
  ])
}

export const notifyBookingConfirmation = async (
  userId: string,
  email: string,
  name: string,
  lockerNumber: string,
  floorNumber: number,
  startDate: string,
  endDate: string,
  userBookingsLink: string,
  adminBookingsLink: string,
): Promise<void> => {
  await createNotification({
    title: 'Booking Confirmed',
    adminTitle: `Booking created for Locker ${lockerNumber}`,
    caption: `Your booking for Locker ${lockerNumber} on Floor ${floorNumber} from ${startDate} to ${endDate} has been confirmed.`,
    type: 'info',
    scope: 'user',
    userIds: [userId],
  })

  await sendBookingEmails(
    email,
    { name, lockerNumber, floorNumber, startDate, endDate },
    'locker-booking-confirmation-user',
    'locker-booking-confirmation-admin',
    'User booking confirmation',
    'Admin booking confirmation',
    { BOOKINGS_LINK: userBookingsLink },
    { BOOKINGS_LINK: adminBookingsLink },
  )
}

export const notifyBookingCancellation = async (
  userId: string,
  email: string,
  name: string,
  lockerNumber: string,
  floorNumber: number,
  startDate: string,
  endDate: string,
  keyStatus: string,
  keyNumber: string,
): Promise<void> => {
  await createNotification({
    title: 'Booking Cancelled',
    adminTitle: `Booking cancelled for Locker ${lockerNumber}`,
    caption: `Your booking for Locker ${lockerNumber} on Floor ${floorNumber} from ${startDate} to ${endDate} has been cancelled.`,
    type: 'info',
    scope: 'user',
    userIds: [userId],
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
    'User booking cancellation',
    'Admin booking cancellation',
    { MESSAGE: userMessage },
    { MESSAGE: adminMessage },
  )
}

export const notifyBookingExtension = async (
  userId: string,
  email: string,
  name: string,
  lockerNumber: string,
  floorNumber: number,
  originalEndDate: string,
  newEndDate: string,
  userBookingsLink: string,
  adminBookingsLink: string,
): Promise<void> => {
  await createNotification({
    title: 'Booking Extended',
    adminTitle: `Booking extended for Locker ${lockerNumber}`,
    caption: `Your booking for Locker ${lockerNumber} has been extended until ${newEndDate}.`,
    type: 'success',
    scope: 'user',
    userIds: [userId],
  })

  await sendBookingEmails(
    email,
    { name, lockerNumber, floorNumber, endDate: newEndDate },
    'extended-locker-booking-user',
    'extended-locker-booking-admin',
    'Booking extension',
    'Booking extension',
    { ORIGINAL_END_DATE: originalEndDate, NEW_END_DATE: newEndDate, BOOKINGS_LINK: userBookingsLink },
    { ORIGINAL_END_DATE: originalEndDate, NEW_END_DATE: newEndDate, BOOKINGS_LINK: adminBookingsLink },
  )
}
