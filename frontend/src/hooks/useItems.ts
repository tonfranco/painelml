import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Item, ItemsStats } from '@/types';

export function useItems(accountId?: string) {
  return useQuery({
    queryKey: ['items', accountId],
    queryFn: async () => {
      const { data } = await api.get<{ items: Item[] }>('/items', {
        params: { accountId },
      });
      return data.items;
    },
    enabled: !!accountId,
  });
}

export function useItemsStats(accountId?: string) {
  return useQuery({
    queryKey: ['items', 'stats', accountId],
    queryFn: async () => {
      const { data } = await api.get<ItemsStats>('/items/stats', {
        params: { accountId },
      });
      return data;
    },
    enabled: !!accountId,
  });
}

export function useItem(id: string, accountId?: string) {
  return useQuery({
    queryKey: ['items', id, accountId],
    queryFn: async () => {
      const { data } = await api.get<Item>(`/items/${id}`, {
        params: { accountId },
      });
      return data;
    },
    enabled: !!id && !!accountId,
  });
}
