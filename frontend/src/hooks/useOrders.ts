import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Order, OrdersStats } from '@/types';

export function useOrders(accountId?: string, days: number = 30) {
  return useQuery({
    queryKey: ['orders', accountId, days],
    queryFn: async () => {
      const { data } = await api.get<{ items: Order[] }>('/orders', {
        params: { accountId, days },
      });
      return data.items;
    },
    enabled: !!accountId,
  });
}

export function useOrdersStats(accountId?: string, days: number = 30) {
  return useQuery({
    queryKey: ['orders', 'stats', accountId, days],
    queryFn: async () => {
      const { data } = await api.get<OrdersStats>('/orders/stats', {
        params: { accountId, days },
      });
      return data;
    },
    enabled: !!accountId,
  });
}

export function useOrder(id: string, accountId?: string) {
  return useQuery({
    queryKey: ['orders', id, accountId],
    queryFn: async () => {
      const { data } = await api.get<Order>(`/orders/${id}`, {
        params: { accountId },
      });
      return data;
    },
    enabled: !!id && !!accountId,
  });
}
