import sendEmail from '../utils/send-email'
import { createNotification } from './notifications'
import { fromEnv } from '../constants'

const WEBAPP_URL = fromEnv('WEBAPP_URL') || 'http://localhost:3001'
const ADMIN_EMAIL = 'fm@lockerhub.com'

export const notifySpecialRequestSubmitted = async (
  userId: string,
  email: string,
  name: string,
  floorNumber: string,
  endDate: string | null,
  requestId: number,
  userSpecialRequestsPath: string,
  adminSpecialRequestsPath: string,
): Promise<void> => {
  const isPermanent = !endDate
  const allocationType = isPermanent ? 'permanent' : 'extended'

  await createNotification({
    entityType: 'request',
    title: 'Special Request Submitted',
    adminTitle: `New special request #${requestId}`,
    caption: `Your special request for ${allocationType} locker allocation on Floor ${floorNumber} has been submitted and is pending review.`,
    type: 'info',
    scope: 'user',
    userIds: [userId],
    createdBy: userId,
  })

  const userTemplateData = {
    NAME: name,
    REQUEST_ID: requestId,
    SPECIAL_REQUESTS_LINK: `${WEBAPP_URL}${userSpecialRequestsPath}`,
  }

  const adminTemplateData = {
    REQUEST_ID: requestId,
    ADMIN_SPECIAL_REQUESTS_LINK: `${WEBAPP_URL}${adminSpecialRequestsPath}`,
  }

  await Promise.all([
    sendEmail(email, userTemplateData, 'special-request-user', 'Special Request Submitted'),
    sendEmail(ADMIN_EMAIL, adminTemplateData, 'special-request-admin', 'New Special Request Submitted'),
  ])
}

export const notifySpecialRequestApproved = async (
  userId: string,
  email: string,
  name: string,
  floorNumber: string,
  endDate: string | null,
  requestId: number,
  userSpecialRequestsPath: string,
  createdBy?: string,
): Promise<void> => {
  const isPermanent = !endDate
  const allocationType = isPermanent ? 'permanent' : 'extended'

  await createNotification({
    entityType: 'request',
    title: 'Special Request Approved',
    adminTitle: `Special request #${requestId} approved`,
    caption: `Your special request for ${allocationType} locker allocation on Floor ${floorNumber} has been approved.`,
    type: 'success',
    scope: 'user',
    userIds: [userId],
    createdBy: createdBy || null,
  })

  const templateData = {
    NAME: name,
    REQUEST_ID: requestId,
    SPECIAL_REQUESTS_LINK: `${WEBAPP_URL}${userSpecialRequestsPath}`,
  }

  await sendEmail(email, templateData, 'special-request-approved-user', 'Special Request Approved')
}

export const notifySpecialRequestRejected = async (
  userId: string,
  email: string,
  name: string,
  floorNumber: string,
  endDate: string | null,
  requestId: number,
  reason: string,
  userSpecialRequestsPath: string,
  createdBy?: string,
): Promise<void> => {
  const isPermanent = !endDate
  const allocationType = isPermanent ? 'permanent' : 'extended'

  await createNotification({
    entityType: 'request',
    title: 'Special Request Rejected',
    adminTitle: `Special request #${requestId} rejected`,
    caption: `Your special request for ${allocationType} locker allocation on Floor ${floorNumber} has been rejected.`,
    type: 'error',
    scope: 'user',
    userIds: [userId],
    createdBy: createdBy || null,
  })

  const templateData = {
    NAME: name,
    REQUEST_ID: requestId,
    REASON: reason,
    SPECIAL_REQUESTS_LINK: `${WEBAPP_URL}${userSpecialRequestsPath}`,
  }

  await sendEmail(email, templateData, 'special-request-rejected-user', 'Special Request Rejected')
}
