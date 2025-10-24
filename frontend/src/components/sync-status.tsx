'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';

interface SyncStatus {
  running: boolean;
  startedAt: string | null;
  finishedAt: string | null;
  itemsProcessed: number;
  ordersProcessed: number;
  errors: string[];
}

interface SyncStatusProps {
  accountId: string;
}

export function SyncStatus({ accountId }: SyncStatusProps) {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accountId) return;

    const fetchStatus = async () => {
      try {
        const response = await api.get(`/sync/${accountId}/status`);
        setStatus(response.data);
      } catch (error) {
        console.error('Erro ao buscar status de sincronização:', error);
      } finally {
        setLoading(false);
      }
    };

    // Buscar status imediatamente
    fetchStatus();

    // Atualizar a cada 3 segundos enquanto estiver sincronizando
    const interval = setInterval(() => {
      if (status?.running) {
        fetchStatus();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [accountId, status?.running]);

  if (loading || !status) return null;

  // Não mostrar se não está sincronizando e já terminou
  if (!status.running && status.finishedAt) return null;

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {status.running ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
              <span>Sincronizando dados do Mercado Livre...</span>
            </>
          ) : status.errors.length > 0 ? (
            <>
              <XCircle className="h-4 w-4 text-red-600" />
              <span>Sincronização concluída com erros</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Sincronização concluída!</span>
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Produtos processados:</span>
            <span className="font-medium">{status.itemsProcessed}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Pedidos processados:</span>
            <span className="font-medium">{status.ordersProcessed}</span>
          </div>
          {status.errors.length > 0 && (
            <div className="mt-2 rounded bg-red-100 p-2 text-xs text-red-800">
              {status.errors.length} erro(s) encontrado(s)
            </div>
          )}
          {status.running && (
            <p className="mt-2 text-xs text-gray-500">
              Isso pode levar alguns minutos dependendo da quantidade de dados...
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
