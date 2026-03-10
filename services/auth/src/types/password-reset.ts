export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetResponse {
  message: string;
  isPreRegistered?: boolean;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface ValidateTokenResult {
  email: string;
}

export interface UserWithResetToken {
  user_id: string;
  email: string;
  is_pre_registered: boolean;
  password_reset_token: string;
  password_reset_expires: Date;
}
