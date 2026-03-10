export interface SendPasswordResetEmailRequest {
  email: string;
  name: string;
  resetLink: string;
}

export interface SendActivationEmailRequest {
  email: string;
  name: string;
  activationLink: string;
}

export interface NotificationServiceResponse {
  success: boolean;
  message: string;
}
