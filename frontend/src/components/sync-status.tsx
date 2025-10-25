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
    <Card className={`border-l-4 ${
      status.running 
        ? 'border-l-blue-500 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-gray-900'
        : status.errors.length > 0
        ? 'border-l-red-500 bg-gradient-to-br from-red-50 to-white dark:from-red-950 dark:to-gray-900'
        : 'border-l-green-500 bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-gray-900'
    }`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
          {status.running ? (
            <>
              <RefreshCw className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
              <span>Sincronizando dados do Mercado Livre...</span>
            </>
          ) : status.errors.length > 0 ? (
            <>
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <span>Sincronização concluída com erros</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span>Sincronização concluída!</span>
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="font-semibold text-gray-600 dark:text-gray-400">Produtos processados:</span>
            <span className="font-bold text-gray-900 dark:text-white">{status.itemsProcessed}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-gray-600 dark:text-gray-400">Pedidos processados:</span>
            <span className="font-bold text-gray-900 dark:text-white">{status.ordersProcessed}</span>
          </div>
          {status.errors.length > 0 && (
            <div className="mt-2 rounded-lg bg-red-100 p-3 text-xs font-bold text-red-800 dark:bg-red-900 dark:text-red-200">
              {status.errors.length} erro(s) encontrado(s)
            </div>
          )}
          {status.running && (
            <p className="mt-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              Isso pode levar alguns minutos dependendo da quantidade de dados...
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
