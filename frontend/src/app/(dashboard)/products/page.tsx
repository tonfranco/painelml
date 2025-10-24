'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { useItems, useItemsStats } from '@/hooks/useItems';
import { ProductList } from '@/components/products/product-list';
import { ProductStats } from '@/components/products/product-stats';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SyncStatus } from '@/components/sync-status';

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
      <div className="container mx-auto px-4 py-8">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-center gap-3 p-6">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-900">
                Nenhuma conta conectada
              </p>
              <p className="text-sm text-yellow-700">
                Conecte uma conta do Mercado Livre para visualizar seus produtos.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 p-6">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div className="flex-1">
              <p className="font-medium text-red-900">Erro ao carregar produtos</p>
              <p className="text-sm text-red-700">
                {error instanceof Error ? error.message : 'Erro desconhecido'}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Catálogo de Produtos</h1>
          <p className="mt-1 text-gray-600">
            Gerencie seus produtos do Mercado Livre
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isLoading}
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
        <div className="mb-8">
          <ProductStats stats={stats} />
        </div>
      )}

      {/* Lista de produtos */}
      <ProductList items={items} isLoading={isLoading} />
    </div>
  );
}
