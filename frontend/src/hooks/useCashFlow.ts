import { useQuery } from '@tanstack/react-query';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export function useCashFlowForecast(accountId: string | null) {
  return useQuery({
    queryKey: ['cash-flow-forecast', accountId],
    queryFn: async () => {
      if (!accountId) throw new Error('Account ID is required');
      
      const response = await fetch(`${API_BASE_URL}/billing/cash-flow/forecast?accountId=${accountId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch cash flow forecast');
      }
      
      return response.json();
    },
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useBankReconciliation(accountId: string | null) {
  return useQuery({
    queryKey: ['bank-reconciliation', accountId],
    queryFn: async () => {
      if (!accountId) throw new Error('Account ID is required');
      
      const response = await fetch(`${API_BASE_URL}/billing/reconciliation?accountId=${accountId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch bank reconciliation');
      }
      
      return response.json();
    },
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDivergenceAlerts(accountId: string | null) {
  return useQuery({
    queryKey: ['divergence-alerts', accountId],
    queryFn: async () => {
      if (!accountId) throw new Error('Account ID is required');
      
      const response = await fetch(`${API_BASE_URL}/billing/alerts/divergence?accountId=${accountId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch divergence alerts');
      }
      
      return response.json();
    },
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000,
  });
}
