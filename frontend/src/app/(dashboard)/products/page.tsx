'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, AlertCircle, ExternalLink } from 'lucide-react';
import { useItems, useItemsStats } from '@/hooks/useItems';
import { ProductStats } from '@/components/products/product-stats';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading} size="sm">
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
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

      {/* Products Grid */}
      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-500" />
            <p className="mt-4 text-lg font-semibold">Carregando produtos...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {items.length} produtos encontrados
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {items.map((item) => (
              <Card
                key={item.id}
                className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    {item.thumbnail && (
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 mb-1">
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {item.meliItemId}
                      </p>
                      {/* Status Badge */}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.status === 'active' && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
                            ✓ Ativo
                          </Badge>
                        )}
                        {item.status === 'paused' && (
                          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs">
                            ⏸ Pausado
                          </Badge>
                        )}
                        {item.status === 'under_review' && (
                          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 text-xs">
                            🔍 Em Revisão
                          </Badge>
                        )}
                        {item.status === 'closed' && (
                          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 text-xs">
                            ✕ Fechado
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Preço:</span>
                    <span className="font-bold text-green-600 dark:text-green-400">
                      R$ {item.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Estoque:</span>
                    <span className="font-bold">{item.available}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Vendidos:</span>
                    <span className="font-bold text-blue-600">{item.sold}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.permalink) {
                          window.open(item.permalink, '_blank');
                        }
                      }}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Ver Anúncio
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </>
  );
}
