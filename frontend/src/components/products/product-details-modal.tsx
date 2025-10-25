'use client';

import { X, ExternalLink, Package, Calendar, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Item } from '@/types';

interface ProductDetailsModalProps {
  item: Item;
  onClose: () => void;
}

export function ProductDetailsModal({ item, onClose }: ProductDetailsModalProps) {
  const statusConfig = {
    active: { label: 'Ativo', variant: 'success' as const },
    paused: { label: 'Pausado', variant: 'warning' as const },
    closed: { label: 'Fechado', variant: 'danger' as const },
  };

  const status = statusConfig[item.status] || statusConfig.active;
  const isOutOfStock = item.available === 0;
  
  // Usar picture (alta resolução) se disponível, senão thumbnail
  const imageUrl = item.picture || item.thumbnail;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-2xl dark:bg-gray-900">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b-4 border-b-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 p-6 dark:from-blue-950 dark:to-purple-950">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Detalhes do Produto</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-red-100 dark:hover:bg-red-900">
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Imagem */}
            <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 border-4 border-blue-500">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Package className="h-24 w-24 text-gray-400" />
                </div>
              )}
            </div>

            {/* Informações */}
            <div className="space-y-4">
              <div>
                <div className="mb-3 flex items-start justify-between gap-2">
                  <Badge variant={status.variant} className="text-sm font-bold">{status.label}</Badge>
                  {isOutOfStock && (
                    <Badge variant="danger" className="text-sm font-bold">Sem estoque</Badge>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{item.title}</h3>
              </div>

              <div className="rounded-lg border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-white p-4 dark:from-blue-950 dark:to-gray-900">
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">Preço</div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(item.price)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-white p-3 dark:from-green-950 dark:to-gray-900">
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">Disponível</div>
                  <div className={`text-2xl font-bold ${isOutOfStock ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                    {formatNumber(item.available)}
                  </div>
                </div>
                <div className="rounded-lg border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-white p-3 dark:from-purple-950 dark:to-gray-900">
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">Vendidos</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatNumber(item.sold)}
                  </div>
                </div>
              </div>

              {/* Informações adicionais */}
              <div className="space-y-3 border-t-2 border-gray-200 pt-4 dark:border-gray-700">
                <div className="flex items-center gap-2 text-sm">
                  <Tag className="h-4 w-4 text-blue-500" />
                  <span className="font-semibold text-gray-700 dark:text-gray-300">ID ML:</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white">{item.meliItemId}</span>
                </div>

                {item.condition && (
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-green-500" />
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Condição:</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {item.condition === 'new' ? 'Novo' : 'Usado'}
                    </span>
                  </div>
                )}

                {item.listingType && (
                  <div className="flex items-center gap-2 text-sm">
                    <Tag className="h-4 w-4 text-purple-500" />
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Tipo:</span>
                    <span className="font-bold text-gray-900 dark:text-white">{item.listingType}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-amber-500" />
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Atualizado:</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {format(new Date(item.updatedAt), "dd 'de' MMMM 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </span>
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-2 border-t-2 border-gray-200 pt-4 dark:border-gray-700">
                {item.permalink && (
                  <Button
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 font-bold hover:from-blue-600 hover:to-purple-600"
                    onClick={() => window.open(item.permalink, '_blank')}
                  >
                    <ExternalLink className="mr-2 h-5 w-5" />
                    Ver no Mercado Livre
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
