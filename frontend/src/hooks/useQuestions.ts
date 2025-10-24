import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Question, QuestionsStats } from '@/types';

export function useQuestions(accountId?: string, status?: string) {
  return useQuery({
    queryKey: ['questions', accountId, status],
    queryFn: async () => {
      const { data } = await api.get<Question[]>('/questions', {
        params: { accountId, status },
      });
      return data;
    },
    enabled: !!accountId,
  });
}

export function useQuestionsStats(accountId?: string) {
  return useQuery({
    queryKey: ['questions', 'stats', accountId],
    queryFn: async () => {
      const { data } = await api.get<QuestionsStats>('/questions/stats', {
        params: { accountId },
      });
      return data;
    },
    enabled: !!accountId,
  });
}

export function useAnswerQuestion(accountId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ questionId, answer }: { questionId: string; answer: string }) => {
      const { data } = await api.post(`/questions/${questionId}/answer`, 
        { answer },
        { params: { accountId } }
      );
      return data;
    },
    onSuccess: () => {
      // Invalidar queries para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['questions', 'stats'] });
    },
  });
}
