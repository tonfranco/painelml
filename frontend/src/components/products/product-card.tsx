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

  // Usar picture (alta resolução) se disponível, senão thumbnail
  const imageUrl = item.picture || item.thumbnail;

  return (
    <Card className="overflow-hidden border-l-4 border-l-blue-500 transition-all hover:shadow-lg hover:scale-[1.02]">
      <div className="relative aspect-square bg-gray-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="h-16 w-16 text-gray-400" />
          </div>
        )}
        
        {/* Badge de status */}
        <div className="absolute right-1 top-1">
          <Badge variant={status.variant} className="text-xs px-2 py-0.5">{status.label}</Badge>
        </div>

        {/* Badge de estoque */}
        {isOutOfStock && (
          <div className="absolute left-1 top-1">
            <Badge variant="danger" className="text-xs px-2 py-0.5">Sem estoque</Badge>
          </div>
        )}
        {isLowStock && (
          <div className="absolute left-1 top-1">
            <Badge variant="warning" className="text-xs px-2 py-0.5">Estoque baixo</Badge>
          </div>
        )}
      </div>

      <CardContent className="p-3">
        <h3 className="mb-2 line-clamp-2 min-h-[2.5rem] text-xs font-bold text-gray-900 dark:text-white">
          {item.title}
        </h3>

        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(item.price)}
          </span>
        </div>

        <div className="mb-3 flex items-center justify-between text-xs">
          <div>
            <span className="font-semibold text-gray-700 dark:text-gray-300">Disp:</span>{' '}
            <span className={isOutOfStock ? 'text-red-600 dark:text-red-400 font-bold' : 'font-semibold text-gray-900 dark:text-white'}>
              {item.available}
            </span>
          </div>
          <div>
            <span className="font-semibold text-gray-700 dark:text-gray-300">Vend:</span>{' '}
            <span className="font-semibold text-gray-900 dark:text-white">{item.sold}</span>
          </div>
        </div>

        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs py-1 h-7"
            onClick={() => onViewDetails?.(item)}
          >
            Detalhes
          </Button>
          {item.permalink && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => window.open(item.permalink, '_blank')}
              title="Abrir no Mercado Livre"
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
