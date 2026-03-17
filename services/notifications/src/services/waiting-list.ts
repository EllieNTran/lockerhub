import sendEmail from '../utils/send-email'
import { createNotification } from './notifications'

export const notifyJoinedWaitingList = async (
  userId: string,
  email: string,
  name: string,
  floorNumber: string,
  startDate: string,
  endDate: string,
): Promise<void> => {
  await createNotification({
    entityType: 'waiting_list',
    title: 'Joined Waiting List',
    adminTitle: `${name} joined the waiting list for Floor ${floorNumber}`,
    caption: `You have successfully joined the waiting list for Floor ${floorNumber} from ${startDate} to ${endDate}.`,
    type: 'info',
    scope: 'user',
    userIds: [userId],
    createdBy: userId,
  })

  await sendEmail(
    email,
    { NAME: name, FLOOR: floorNumber, START_DATE: startDate, END_DATE: endDate },
    'joined-waiting-list-user',
    'Joined Waiting List',
  )
}

export const notifyRemovedFromWaitingList = async (
  userId: string,
  email: string,
  name: string,
  floorNumber: string,
  startDate: string,
  endDate: string,
): Promise<void> => {
  await createNotification({
    entityType: 'waiting_list',
    title: 'Removed from Waiting List',
    adminTitle: `${name} was removed from the waiting list for Floor ${floorNumber}`,
    caption: `You have been removed from the waiting list for Floor ${floorNumber} (${startDate} to ${endDate}) as you already have an active booking for these dates.`,
    type: 'info',
    scope: 'user',
    userIds: [userId],
    createdBy: userId,
  })

  await sendEmail(
    email,
    { NAME: name, FLOOR: floorNumber, START_DATE: startDate, END_DATE: endDate },
    'removed-from-waiting-list-user',
    'Removed from Waiting List',
  )
}
