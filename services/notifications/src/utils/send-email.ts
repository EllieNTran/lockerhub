import { Resend } from 'resend'
import logger from '../logger'
import { fromEnv } from '../constants'

const resend = new Resend(fromEnv('RESEND_API_KEY'))

const sendEmail = async (
  // @ts-expect-error - recipientEmail will be used in production
  recipientEmail: string,
  variables: Record<string, string | number>,
  templateId: string,
  emailType: string,
): Promise<void> => {
  const emailPayload = {
    from: 'LockerHub <onboarding@resend.dev>',
    to: 'ellie.tran18@gmail.com', // Change to recipientEmail in production
    template: {
      id: templateId,
      variables: {
        ...variables,
      },
    },
  }

  logger.debug({ emailPayload, emailType }, `Attempting to send ${emailType} email`)

  try {
    const response = await resend.emails.send(emailPayload)

    if (response.error) {
      logger.error(`Resend API error: ${response.error.message}`)
      throw new Error(`Failed to send email: ${response.error.message}`)
    }

    logger.info(`${emailType} email sent successfully`)
  } catch (error: unknown) {
    logger.error(`Failed to send ${emailType} email`)
    throw error
  }
}

export default sendEmail
