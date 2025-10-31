import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

interface ExtraRevenue {
  id: string;
  name: string;
  category: string;
  amount: number;
  description?: string;
  isRecurring: boolean;
  isActive: boolean;
  startDate: string;
  endDate?: string;
}

export function useExtraRevenues(accountId: string | null) {
  return useQuery<ExtraRevenue[]>({
    queryKey: ['extra-revenues', accountId],
    queryFn: async () => {
      if (!accountId) throw new Error('Account ID is required');
      
      const response = await fetch(`${API_BASE_URL}/extra-revenues?accountId=${accountId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch extra revenues');
      }
      
      return response.json();
    },
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useExtraRevenuesSummary(accountId: string | null) {
  return useQuery({
    queryKey: ['extra-revenues-summary', accountId],
    queryFn: async () => {
      if (!accountId) throw new Error('Account ID is required');
      
      const response = await fetch(`${API_BASE_URL}/extra-revenues/summary?accountId=${accountId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch extra revenues summary');
      }
      
      return response.json();
    },
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateExtraRevenue(accountId: string | null) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      name: string;
      category: string;
      amount: number;
      description?: string;
      isRecurring?: boolean;
    }) => {
      if (!accountId) throw new Error('Account ID is required');
      
      const response = await fetch(`${API_BASE_URL}/extra-revenues?accountId=${accountId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create extra revenue');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extra-revenues', accountId] });
      queryClient.invalidateQueries({ queryKey: ['extra-revenues-summary', accountId] });
      queryClient.invalidateQueries({ queryKey: ['financial-stats', accountId] });
    },
  });
}

export function useUpdateExtraRevenue() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ExtraRevenue> }) => {
      const response = await fetch(`${API_BASE_URL}/extra-revenues/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update extra revenue');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extra-revenues'] });
      queryClient.invalidateQueries({ queryKey: ['extra-revenues-summary'] });
      queryClient.invalidateQueries({ queryKey: ['financial-stats'] });
    },
  });
}

export function useDeleteExtraRevenue() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/extra-revenues/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete extra revenue');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extra-revenues'] });
      queryClient.invalidateQueries({ queryKey: ['extra-revenues-summary'] });
      queryClient.invalidateQueries({ queryKey: ['financial-stats'] });
    },
  });
}
