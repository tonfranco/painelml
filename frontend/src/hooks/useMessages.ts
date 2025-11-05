import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Message, Conversation, MessagesStats } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Hook para buscar todas as mensagens
export function useMessages(accountId: string, filters?: { packId?: string; orderId?: string; status?: string }) {
  return useQuery<Message[]>({
    queryKey: ['messages', accountId, filters],
    queryFn: async () => {
      const params = new URLSearchParams({ accountId });
      if (filters?.packId) params.append('packId', filters.packId);
      if (filters?.orderId) params.append('orderId', filters.orderId);
      if (filters?.status) params.append('status', filters.status);

      const response = await fetch(`${API_URL}/messages?${params}`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    },
    enabled: !!accountId,
  });
}

// Hook para buscar conversas agrupadas
export function useConversations(accountId: string) {
  return useQuery<Conversation[]>({
    queryKey: ['conversations', accountId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/messages/conversations?accountId=${accountId}`);
      if (!response.ok) throw new Error('Failed to fetch conversations');
      return response.json();
    },
    enabled: !!accountId,
  });
}

// Hook para buscar estatísticas de mensagens
export function useMessagesStats(accountId: string) {
  return useQuery<MessagesStats>({
    queryKey: ['messages-stats', accountId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/messages/stats?accountId=${accountId}`);
      if (!response.ok) throw new Error('Failed to fetch messages stats');
      return response.json();
    },
    enabled: !!accountId,
  });
}

// Hook para sincronizar mensagens
export function useSyncMessages(accountId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_URL}/messages/sync?accountId=${accountId}`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      // Mesmo com erro, retornar os dados para mostrar mensagem ao usuário
      if (!response.ok) {
        throw new Error(data.message || 'Failed to sync messages');
      }
      
      return data;
    },
    onSuccess: (data) => {
      // Invalidar queries mesmo se não sincronizou nada
      queryClient.invalidateQueries({ queryKey: ['messages', accountId] });
      queryClient.invalidateQueries({ queryKey: ['conversations', accountId] });
      queryClient.invalidateQueries({ queryKey: ['messages-stats', accountId] });
    },
  });
}

// Hook para enviar mensagem
export function useSendMessage(accountId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ packId, text }: { packId: string; text: string }) => {
      const response = await fetch(`${API_URL}/messages/send?accountId=${accountId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ packId, text }),
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', accountId] });
      queryClient.invalidateQueries({ queryKey: ['conversations', accountId] });
      queryClient.invalidateQueries({ queryKey: ['messages-stats', accountId] });
    },
  });
}

// Hook para marcar mensagens como lidas
export function useMarkAsRead(accountId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageIds: string[]) => {
      const response = await fetch(`${API_URL}/messages/mark-read?accountId=${accountId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messageIds }),
      });
      if (!response.ok) throw new Error('Failed to mark messages as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', accountId] });
      queryClient.invalidateQueries({ queryKey: ['conversations', accountId] });
      queryClient.invalidateQueries({ queryKey: ['messages-stats', accountId] });
    },
  });
}
