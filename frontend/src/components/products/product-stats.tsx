'use client';

import { Package, PlayCircle, PauseCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber } from '@/lib/utils';
import type { ItemsStats } from '@/types';

interface ProductStatsProps {
  stats: ItemsStats;
}

export function ProductStats({ stats }: ProductStatsProps) {
  const statCards = [
    {
      title: 'Total de Produtos',
      value: stats.total,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Ativos',
      value: stats.active,
      icon: PlayCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Pausados',
      value: stats.paused,
      icon: PauseCircle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Fechados',
      value: stats.closed,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`rounded-full p-2 ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stat.value)}</div>
              {stat.title === 'Total de Produtos' && stats.total > 0 && (
                <p className="mt-1 text-xs text-gray-500">
                  {Math.round((stats.active / stats.total) * 100)}% ativos
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
