'use client';

import { useEffect, useState } from 'react';
import { Package, ShoppingCart, MessageCircle, TrendingUp } from 'lucide-react';
import { useItemsStats } from '@/hooks/useItems';
import { useOrdersStats } from '@/hooks/useOrders';
import { useQuestionsStats } from '@/hooks/useQuestions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Loading } from '@/components/ui/loading';

export default function DashboardPage() {
  const [accountId, setAccountId] = useState<string>('');

  useEffect(() => {
    const id = localStorage.getItem('accountId');
    if (id) {
      setAccountId(id);
    }
  }, []);

  const { data: itemsStats, isLoading: loadingItems } = useItemsStats(accountId);
  const { data: ordersStats, isLoading: loadingOrders } = useOrdersStats(accountId);
  const { data: questionsStats, isLoading: loadingQuestions } = useQuestionsStats(accountId);

  const isLoading = loadingItems || loadingOrders || loadingQuestions;

  if (!accountId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-600">Nenhuma conta conectada</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loading size="lg" className="text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="mt-1 text-lg text-gray-700 dark:text-gray-300">
          Visão geral do seu negócio no Mercado Livre
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Produtos */}
        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-gray-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Produtos Ativos
            </CardTitle>
            <div className="rounded-full bg-blue-500 p-2.5">
              <Package className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {itemsStats ? formatNumber(itemsStats.active) : '-'}
            </div>
            <p className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-300">
              {itemsStats ? `${formatNumber(itemsStats.total)} total` : ''}
            </p>
          </CardContent>
        </Card>

        {/* Pedidos */}
        <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-gray-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Pedidos (30 dias)
            </CardTitle>
            <div className="rounded-full bg-green-500 p-2.5">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {ordersStats ? formatNumber(ordersStats.total) : '-'}
            </div>
            <p className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-300">
              {ordersStats ? `${formatNumber(ordersStats.paid)} pagos` : ''}
            </p>
          </CardContent>
        </Card>

        {/* Faturamento */}
        <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950 dark:to-gray-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Faturamento
            </CardTitle>
            <div className="rounded-full bg-purple-500 p-2.5">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {ordersStats ? formatCurrency(ordersStats.totalAmount) : '-'}
            </div>
            <p className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-300">Últimos 30 dias</p>
          </CardContent>
        </Card>

        {/* Perguntas */}
        <Card className="border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950 dark:to-gray-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Perguntas Pendentes
            </CardTitle>
            <div className="rounded-full bg-amber-500 p-2.5">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {questionsStats ? formatNumber(questionsStats.unanswered) : '-'}
            </div>
            {questionsStats && questionsStats.overdueSLA > 0 && (
              <p className="mt-1 text-sm font-semibold text-red-600 dark:text-red-400">
                {formatNumber(questionsStats.overdueSLA)} fora do SLA
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Acesso Rápido</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="cursor-pointer border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-white transition-all hover:shadow-lg hover:scale-105 dark:from-blue-950 dark:to-gray-900">
            <CardContent className="p-6">
              <a href="/products" className="block">
                <div className="mb-3 inline-block rounded-lg bg-blue-500 p-3">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Produtos</h3>
                <p className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-300">
                  Gerencie seu catálogo
                </p>
              </a>
            </CardContent>
          </Card>

          <Card className="cursor-pointer border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-white transition-all hover:shadow-lg hover:scale-105 dark:from-green-950 dark:to-gray-900">
            <CardContent className="p-6">
              <a href="/orders" className="block">
                <div className="mb-3 inline-block rounded-lg bg-green-500 p-3">
                  <ShoppingCart className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Pedidos</h3>
                <p className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-300">
                  Acompanhe suas vendas
                </p>
              </a>
            </CardContent>
          </Card>

          <Card className="cursor-pointer border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-50 to-white transition-all hover:shadow-lg hover:scale-105 dark:from-amber-950 dark:to-gray-900">
            <CardContent className="p-6">
              <a href="/questions" className="block">
                <div className="mb-3 inline-block rounded-lg bg-amber-500 p-3">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Perguntas</h3>
                <p className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-300">
                  Responda seus clientes
                </p>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
