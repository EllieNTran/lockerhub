import { apiClient } from '@/services/apiClient';

export interface UpdateTutorialResponse {
  message: string;
}

/**
 * Update tutorial status for the current user
 */
export const updateTutorialStatus = async (): Promise<UpdateTutorialResponse> => {
  return apiClient.patch<UpdateTutorialResponse>('/auth/tutorial/complete');
};
