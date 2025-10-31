import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

interface Tax {
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

export function useTaxes(accountId: string | null) {
  return useQuery<Tax[]>({
    queryKey: ['taxes', accountId],
    queryFn: async () => {
      if (!accountId) throw new Error('Account ID is required');
      
      const response = await fetch(`${API_BASE_URL}/taxes?accountId=${accountId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch taxes');
      }
      
      return response.json();
    },
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useTaxesSummary(accountId: string | null) {
  return useQuery({
    queryKey: ['taxes-summary', accountId],
    queryFn: async () => {
      if (!accountId) throw new Error('Account ID is required');
      
      const response = await fetch(`${API_BASE_URL}/taxes/summary?accountId=${accountId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch taxes summary');
      }
      
      return response.json();
    },
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateTax(accountId: string | null) {
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
      
      const response = await fetch(`${API_BASE_URL}/taxes?accountId=${accountId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create tax');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxes', accountId] });
      queryClient.invalidateQueries({ queryKey: ['taxes-summary', accountId] });
      queryClient.invalidateQueries({ queryKey: ['financial-stats', accountId] });
    },
  });
}

export function useUpdateTax() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Tax> }) => {
      const response = await fetch(`${API_BASE_URL}/taxes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update tax');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxes'] });
      queryClient.invalidateQueries({ queryKey: ['taxes-summary'] });
      queryClient.invalidateQueries({ queryKey: ['financial-stats'] });
    },
  });
}

export function useDeleteTax() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/taxes/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete tax');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxes'] });
      queryClient.invalidateQueries({ queryKey: ['taxes-summary'] });
      queryClient.invalidateQueries({ queryKey: ['financial-stats'] });
    },
  });
}
