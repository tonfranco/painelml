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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-4">
          <h2 className="text-xl font-bold">Detalhes do Produto</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Imagem */}
            <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
              {item.thumbnail ? (
                <img
                  src={item.thumbnail}
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
                <div className="mb-2 flex items-start justify-between">
                  <Badge variant={status.variant}>{status.label}</Badge>
                  {isOutOfStock && (
                    <Badge variant="danger">Sem estoque</Badge>
                  )}
                </div>
                <h3 className="text-2xl font-bold">{item.title}</h3>
              </div>

              <div className="rounded-lg bg-blue-50 p-4">
                <div className="text-sm text-gray-600">Preço</div>
                <div className="text-3xl font-bold text-blue-600">
                  {formatCurrency(item.price)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-3">
                  <div className="text-sm text-gray-600">Disponível</div>
                  <div className={`text-2xl font-bold ${isOutOfStock ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatNumber(item.available)}
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-sm text-gray-600">Vendidos</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatNumber(item.sold)}
                  </div>
                </div>
              </div>

              {/* Informações adicionais */}
              <div className="space-y-2 border-t pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <Tag className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">ID ML:</span>
                  <span className="font-mono font-medium">{item.meliItemId}</span>
                </div>

                {item.condition && (
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Condição:</span>
                    <span className="font-medium">
                      {item.condition === 'new' ? 'Novo' : 'Usado'}
                    </span>
                  </div>
                )}

                {item.listingType && (
                  <div className="flex items-center gap-2 text-sm">
                    <Tag className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Tipo:</span>
                    <span className="font-medium">{item.listingType}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Atualizado:</span>
                  <span className="font-medium">
                    {format(new Date(item.updatedAt), "dd 'de' MMMM 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </span>
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-2 border-t pt-4">
                {item.permalink && (
                  <Button
                    className="flex-1"
                    onClick={() => window.open(item.permalink, '_blank')}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
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
