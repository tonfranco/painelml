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
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-gray-600">
          Visão geral do seu negócio no Mercado Livre
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Produtos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Produtos Ativos
            </CardTitle>
            <div className="rounded-full bg-blue-100 p-2">
              <Package className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {itemsStats ? formatNumber(itemsStats.active) : '-'}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {itemsStats ? `${formatNumber(itemsStats.total)} total` : ''}
            </p>
          </CardContent>
        </Card>

        {/* Pedidos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pedidos (30 dias)
            </CardTitle>
            <div className="rounded-full bg-green-100 p-2">
              <ShoppingCart className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ordersStats ? formatNumber(ordersStats.total) : '-'}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {ordersStats ? `${formatNumber(ordersStats.paid)} pagos` : ''}
            </p>
          </CardContent>
        </Card>

        {/* Faturamento */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Faturamento
            </CardTitle>
            <div className="rounded-full bg-purple-100 p-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ordersStats ? formatCurrency(ordersStats.totalAmount) : '-'}
            </div>
            <p className="mt-1 text-xs text-gray-500">Últimos 30 dias</p>
          </CardContent>
        </Card>

        {/* Perguntas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Perguntas Pendentes
            </CardTitle>
            <div className="rounded-full bg-yellow-100 p-2">
              <MessageCircle className="h-4 w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {questionsStats ? formatNumber(questionsStats.unanswered) : '-'}
            </div>
            {questionsStats && questionsStats.overdueSLA > 0 && (
              <p className="mt-1 text-xs text-red-600">
                {formatNumber(questionsStats.overdueSLA)} fora do SLA
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Acesso Rápido</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="p-6">
              <a href="/products" className="block">
                <Package className="mb-2 h-8 w-8 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Produtos</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Gerencie seu catálogo
                </p>
              </a>
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="p-6">
              <a href="/orders" className="block">
                <ShoppingCart className="mb-2 h-8 w-8 text-green-600" />
                <h3 className="font-semibold text-gray-900">Pedidos</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Acompanhe suas vendas
                </p>
              </a>
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="p-6">
              <a href="/questions" className="block">
                <MessageCircle className="mb-2 h-8 w-8 text-yellow-600" />
                <h3 className="font-semibold text-gray-900">Perguntas</h3>
                <p className="mt-1 text-sm text-gray-600">
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
