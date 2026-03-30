import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

interface UpdateTutorialResponse {
  message: string;
}

/**
 * Update tutorial status for the current user
 */
const updateTutorialStatus = async (): Promise<UpdateTutorialResponse> => {
  return apiClient.patch<UpdateTutorialResponse>('/auth/tutorial/complete');
};

/**
 * Hook to mark tutorial as completed
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
