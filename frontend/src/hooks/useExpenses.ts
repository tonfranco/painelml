import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

interface Expense {
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

export function useExpenses(accountId: string | null) {
  return useQuery<Expense[]>({
    queryKey: ['expenses', accountId],
    queryFn: async () => {
      if (!accountId) throw new Error('Account ID is required');
      
      const response = await fetch(`${API_BASE_URL}/expenses?accountId=${accountId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch expenses');
      }
      
      return response.json();
    },
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useExpensesSummary(accountId: string | null) {
  return useQuery({
    queryKey: ['expenses-summary', accountId],
    queryFn: async () => {
      if (!accountId) throw new Error('Account ID is required');
      
      const response = await fetch(`${API_BASE_URL}/expenses/summary?accountId=${accountId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch expenses summary');
      }
      
      return response.json();
    },
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateExpense(accountId: string | null) {
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
      
      const response = await fetch(`${API_BASE_URL}/expenses?accountId=${accountId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create expense');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', accountId] });
      queryClient.invalidateQueries({ queryKey: ['expenses-summary', accountId] });
      queryClient.invalidateQueries({ queryKey: ['cost-breakdown', accountId] });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Expense> }) => {
      const response = await fetch(`${API_BASE_URL}/expenses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update expense');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-summary'] });
      queryClient.invalidateQueries({ queryKey: ['cost-breakdown'] });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/expenses/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete expense');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-summary'] });
      queryClient.invalidateQueries({ queryKey: ['cost-breakdown'] });
    },
  });
}
