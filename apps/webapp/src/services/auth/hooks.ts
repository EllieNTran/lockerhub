import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { signup, login, logout } from './services/auth';
import { getDepartments, getOffices, validateStaffNumber, checkAccount } from './services/metadata';
import { requestPasswordReset, resetPassword, validateResetToken } from './services/password';
import { updateTutorialStatus } from './services/tutorial';
import type { SignupRequest, LoginRequest } from './services/auth';

/**
 * Fetch departments list
 */
export const useDepartments = () =>
  useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

/**
 * Fetch offices list
 */
export const useOffices = () =>
  useQuery({
    queryKey: ['offices'],
    queryFn: getOffices,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

/**
 * Validate reset token
 */
export const useValidateResetToken = (token: string) =>
  useQuery({
    queryKey: ['validateResetToken', token],
    queryFn: () => validateResetToken(token),
    enabled: !!token,
    retry: false,
  });

/**
 * Sign up a new user
 */
export const useSignup = () => {
  return useMutation({
    mutationFn: (data: SignupRequest) => signup(data),
  });
};

/**
 * Login user
 */
export const useLogin = () => {
  return useMutation({
    mutationFn: (data: LoginRequest) => login(data),
  });
};

/**
 * Logout user
 */
export const useLogout = () => {
  return useMutation({
    mutationFn: (refreshToken: string) => logout(refreshToken),
  });
};

/**
 * Validate staff number
 */
export const useValidateStaffNumber = () => {
  return useMutation({
    mutationFn: (staffNumber: string) => validateStaffNumber(staffNumber),
  });
};

/**
 * Check account status
 */
export const useCheckAccount = () => {
  return useMutation({
    mutationFn: (email: string) => checkAccount(email),
  });
};

/**
 * Request password reset
 */
export const useRequestPasswordReset = () => {
  return useMutation({
    mutationFn: (email: string) => requestPasswordReset(email),
  });
};

/**
 * Reset password with token
 */
export const useResetPassword = () => {
  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      resetPassword(token, password),
  });
};

/**
 * Mark tutorial as completed
 */
export const useCompleteTutorial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTutorialStatus,
    onSuccess: () => {
      const userRole = localStorage.getItem('userRole');
      if (userRole) {
        localStorage.setItem('hasSeenTutorial', 'true');
        window.dispatchEvent(new Event('tutorialCompleted'));
      }

      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};
