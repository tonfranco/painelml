import { useQuery } from '@tanstack/react-query';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

interface FinancialStats {
  totalRevenue: number;
  totalFees: number;
  totalTaxes: number;
  totalNet: number;
  avgRevenue: number;
  avgNet: number;
  profitMargin: number;
  periodsCount: number;
  periods: Array<{
    periodKey: string;
    totalAmount: number;
    netAmount: number;
    orderCount?: number;
    dateFrom?: string;
    dateTo?: string;
  }>;
  note?: string;
}

interface BillingPeriod {
  id: string;
  periodKey: string;
  dateFrom: string;
  dateTo: string;
  expirationDate: string;
  periodStatus: string;
  totalAmount: number;
  unpaidAmount: number;
  taxAmount: number;
  feesAmount: number;
  netAmount: number;
  _count?: {
    charges: number;
  };
}

interface BillingPeriodsResponse {
  periods: BillingPeriod[];
  total: number;
  limit: number;
  offset: number;
}

export function useFinancialStats(accountId: string | null, months: number = 12) {
  return useQuery<FinancialStats>({
    queryKey: ['financial-stats', accountId, months],
    queryFn: async () => {
      if (!accountId) throw new Error('Account ID is required');
      
      const response = await fetch(
        `${API_BASE_URL}/billing/stats?accountId=${accountId}&months=${months}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch financial stats');
      }
      
      return response.json();
    },
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useBillingPeriods(
  accountId: string | null,
  options?: {
    limit?: number;
    offset?: number;
    status?: string;
  }
) {
  const { limit = 12, offset = 0, status } = options || {};
  
  return useQuery<BillingPeriodsResponse>({
    queryKey: ['billing-periods', accountId, limit, offset, status],
    queryFn: async () => {
      if (!accountId) throw new Error('Account ID is required');
      
      const params = new URLSearchParams({
        accountId,
        limit: limit.toString(),
        offset: offset.toString(),
      });
      
      if (status) params.append('status', status);
      
      const response = await fetch(`${API_BASE_URL}/billing/periods?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch billing periods');
      }
      
      return response.json();
    },
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useSyncBilling(accountId: string | null) {
  return async () => {
    if (!accountId) throw new Error('Account ID is required');
    
    const response = await fetch(
      `${API_BASE_URL}/billing/sync?accountId=${accountId}`,
      { method: 'POST' }
    );
    
    if (!response.ok) {
      throw new Error('Failed to sync billing data');
    }
    
    return response.json();
  };
}

export function useProductProfitability(accountId: string | null, months: number = 12) {
  return useQuery({
    queryKey: ['product-profitability', accountId, months],
    queryFn: async () => {
      if (!accountId) throw new Error('Account ID is required');
      
      const response = await fetch(
        `${API_BASE_URL}/billing/products/profitability?accountId=${accountId}&months=${months}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch product profitability');
      }
      
      return response.json();
    },
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCostBreakdown(accountId: string | null, months: number = 12) {
  return useQuery({
    queryKey: ['cost-breakdown', accountId, months],
    queryFn: async () => {
      if (!accountId) throw new Error('Account ID is required');
      
      const response = await fetch(
        `${API_BASE_URL}/billing/breakdown?accountId=${accountId}&months=${months}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch cost breakdown');
      }
      
      return response.json();
    },
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000,
  });
}
