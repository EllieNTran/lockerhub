import { apiClient } from '@/services/apiClient';

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string): Promise<{ message: string }> {
  return apiClient.publicRequest<{ message: string }>('/auth/password-reset/request', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/**
 * Reset password with token
 */
export async function resetPassword(token: string, password: string): Promise<{ message: string }> {
  return apiClient.publicRequest<{ message: string }>('/auth/password-reset/reset', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
}

/**
 * Validate password reset token
 */
export async function validateResetToken(token: string): Promise<{ valid: boolean; email?: string }> {
  try {
    return await apiClient.publicRequest<{ valid: boolean; email?: string }>('/auth/password-reset/validate/' + token, {
      method: 'GET',
    });
  } catch {
    return { valid: false };
  }
}
