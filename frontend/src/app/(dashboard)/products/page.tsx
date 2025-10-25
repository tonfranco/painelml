'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { useItems, useItemsStats } from '@/hooks/useItems';
import { ProductList } from '@/components/products/product-list';
import { ProductStats } from '@/components/products/product-stats';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SyncStatus } from '@/components/sync-status';
import { FAB } from '@/components/fab';

export default function ProductsPage() {
  const [accountId, setAccountId] = useState<string>('');

  useEffect(() => {
    // Pegar accountId do localStorage
    const id = localStorage.getItem('accountId');
    if (id) {
      setAccountId(id);
    }
  }, []);

  const { data: items = [], isLoading, error, refetch } = useItems(accountId);
  const { data: stats } = useItemsStats(accountId);

  if (!accountId) {
    return (
      <Card variant="glass" className="border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950 dark:to-gray-900">
        <CardContent className="flex items-center gap-3 p-6">
          <div className="rounded-lg bg-amber-500 p-3">
            <AlertCircle className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              Nenhuma conta conectada
            </p>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Conecte uma conta do Mercado Livre para visualizar seus produtos.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="glass" className="border-l-4 border-l-red-500 bg-gradient-to-br from-red-50 to-white dark:from-red-950 dark:to-gray-900">
        <CardContent className="flex items-center gap-3 p-6">
          <div className="rounded-lg bg-red-500 p-3">
            <AlertCircle className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-lg font-bold text-gray-900 dark:text-white">Erro ao carregar produtos</p>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {error instanceof Error ? error.message : 'Erro desconhecido'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Catálogo de Produtos</h1>
          <p className="mt-1 text-lg text-gray-700 dark:text-gray-300">
            Gerencie seus produtos do Mercado Livre
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isLoading}
          size="sm"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Sync Status */}
      <div className="mb-6">
        <SyncStatus accountId={accountId} />
      </div>

      {/* Stats */}
      {stats && (
        <div className="mb-6">
          <ProductStats stats={stats} />
        </div>
      )}

      {/* Lista de produtos */}
      <ProductList items={items} isLoading={isLoading} />

      {/* FAB */}
      <FAB onClick={() => alert('Adicionar produto')} label="Adicionar Produto" />
    </>
  );
}
