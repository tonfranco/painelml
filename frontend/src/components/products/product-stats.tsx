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
      iconBg: 'bg-blue-500',
      borderColor: 'border-l-blue-500',
      gradient: 'from-blue-50 to-white dark:from-blue-950 dark:to-gray-900',
    },
    {
      title: 'Ativos',
      value: stats.active,
      icon: PlayCircle,
      iconBg: 'bg-green-500',
      borderColor: 'border-l-green-500',
      gradient: 'from-green-50 to-white dark:from-green-950 dark:to-gray-900',
    },
    {
      title: 'Pausados',
      value: stats.paused,
      icon: PauseCircle,
      iconBg: 'bg-amber-500',
      borderColor: 'border-l-amber-500',
      gradient: 'from-amber-50 to-white dark:from-amber-950 dark:to-gray-900',
    },
    {
      title: 'Fechados',
      value: stats.closed,
      icon: XCircle,
      iconBg: 'bg-red-500',
      borderColor: 'border-l-red-500',
      gradient: 'from-red-50 to-white dark:from-red-950 dark:to-gray-900',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className={`border-l-4 ${stat.borderColor} bg-gradient-to-br ${stat.gradient}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                {stat.title}
              </CardTitle>
              <div className={`rounded-full p-2.5 ${stat.iconBg}`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{formatNumber(stat.value)}</div>
              {stat.title === 'Total de Produtos' && stats.total > 0 && (
                <p className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-300">
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
