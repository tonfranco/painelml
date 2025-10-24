'use client';

import { ExternalLink, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import type { Item } from '@/types';

interface ProductCardProps {
  item: Item;
  onViewDetails?: (item: Item) => void;
}

export function ProductCard({ item, onViewDetails }: ProductCardProps) {
  const statusConfig = {
    active: { label: 'Ativo', variant: 'success' as const },
    paused: { label: 'Pausado', variant: 'warning' as const },
    closed: { label: 'Fechado', variant: 'danger' as const },
  };

  const status = statusConfig[item.status] || statusConfig.active;
  const isOutOfStock = item.available === 0;
  const isLowStock = item.available > 0 && item.available < 5;

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <div className="relative aspect-square bg-gray-100">
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="h-16 w-16 text-gray-400" />
          </div>
        )}
        
        {/* Badge de status */}
        <div className="absolute right-2 top-2">
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>

        {/* Badge de estoque */}
        {isOutOfStock && (
          <div className="absolute left-2 top-2">
            <Badge variant="danger">Sem estoque</Badge>
          </div>
        )}
        {isLowStock && (
          <div className="absolute left-2 top-2">
            <Badge variant="warning">Estoque baixo</Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="mb-2 line-clamp-2 min-h-[3rem] text-sm font-semibold">
          {item.title}
        </h3>

        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-blue-600">
            {formatCurrency(item.price)}
          </span>
        </div>

        <div className="mb-4 flex items-center justify-between text-sm text-gray-600">
          <div>
            <span className="font-medium">Disponível:</span>{' '}
            <span className={isOutOfStock ? 'text-red-600 font-semibold' : ''}>
              {item.available}
            </span>
          </div>
          <div>
            <span className="font-medium">Vendidos:</span> {item.sold}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onViewDetails?.(item)}
          >
            Ver detalhes
          </Button>
          {item.permalink && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(item.permalink, '_blank')}
              title="Abrir no Mercado Livre"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
