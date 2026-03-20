import sendEmail from '../utils/send-email'

export const sendResetPasswordEmail = async (
  email: string,
  name: string,
  resetLink: string,
): Promise<void> => {
  await sendEmail(
    email,
    {
      NAME: name,
      EXPIRY_MINUTES: 60,
      RESET_LINK: resetLink,
    },
    'password-reset',
    'Password Reset',
  )
}

export const sendActivationEmail = async (
  email: string,
  name: string,
  activationLink: string,
): Promise<void> => {
  await sendEmail(
    email,
    {
      NAME: name,
      EXPIRY_MINUTES: 60,
      ACTIVATION_LINK: activationLink,
    },
    'account-activation',
    'Account Activation',
  )
}
