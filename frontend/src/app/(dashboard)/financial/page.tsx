'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFinancialStats, useBillingPeriods, useSyncBilling, useProductProfitability, useCostBreakdown } from '@/hooks/useFinancial';
import { useExpenses, useCreateExpense, useDeleteExpense, useExpensesSummary } from '@/hooks/useExpenses';
import { DollarSign, TrendingUp, TrendingDown, Percent, RefreshCw, BarChart3, Filter, Download, Package, Plus, Trash2, Receipt } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Input } from '@/components/ui/input';

export default function FinancialPage() {
  const [accountId] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accountId');
    }
    return null;
  });

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useFinancialStats(accountId);
  const { data: periodsData, isLoading: periodsLoading, refetch: refetchPeriods } = useBillingPeriods(accountId);
  const { data: profitability, isLoading: profitabilityLoading } = useProductProfitability(accountId);
  const { data: breakdown, isLoading: breakdownLoading } = useCostBreakdown(accountId);
  const { data: expenses } = useExpenses(accountId);
  const { data: expensesSummary } = useExpensesSummary(accountId);
  const createExpense = useCreateExpense(accountId);
  const deleteExpense = useDeleteExpense();
  const syncBilling = useSyncBilling(accountId);

  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showChart, setShowChart] = useState(true);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [newExpense, setNewExpense] = useState({
    name: '',
    category: 'OUTROS',
    amount: 0,
    description: '',
  });

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncBilling();
      if (result.success) {
        toast.success(`Sincronizado: ${result.synced} de ${result.total} períodos`);
        refetchStats();
        refetchPeriods();
      } else {
        toast.error(result.error || 'Erro ao sincronizar');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao sincronizar dados financeiros');
    } finally {
      setSyncing(false);
    }
  };

  const formatPeriodKey = (key: string) => {
    const [year, month] = key.split('-');
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${monthNames[parseInt(month) - 1]}/${year}`;
  };

  const handleExportCSV = () => {
    if (!stats?.periods || stats.periods.length === 0) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    const headers = ['Período', 'Faturamento Bruto', 'Faturamento Líquido', 'Margem (%)'];
    const rows = stats.periods.map(period => [
      formatPeriodKey(period.periodKey),
      period.totalAmount.toFixed(2),
      period.netAmount.toFixed(2),
      ((period.netAmount / period.totalAmount) * 100).toFixed(1),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `financeiro_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Relatório exportado com sucesso!');
  };

  const handleCreateExpense = async () => {
    if (!newExpense.name || newExpense.amount <= 0) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      await createExpense.mutateAsync(newExpense);
      toast.success('Despesa criada com sucesso!');
      setShowExpenseModal(false);
      setNewExpense({ name: '', category: 'OUTROS', amount: 0, description: '' });
    } catch (error) {
      toast.error('Erro ao criar despesa');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta despesa?')) return;

    try {
      await deleteExpense.mutateAsync(id);
      toast.success('Despesa excluída com sucesso!');
    } catch (error) {
      toast.error('Erro ao excluir despesa');
    }
  };

  // Filtrar períodos por busca
  const filteredPeriods = stats?.periods?.filter(period => {
    if (!searchTerm) return true;
    const formattedPeriod = formatPeriodKey(period.periodKey).toLowerCase();
    return formattedPeriod.includes(searchTerm.toLowerCase());
  }) || [];

  // Preparar dados para o gráfico
  const chartData = stats?.periods?.slice().reverse().map(period => ({
    name: formatPeriodKey(period.periodKey),
    'Faturamento Bruto': period.totalAmount,
    'Faturamento Líquido': period.netAmount,
  })) || [];

  if (!accountId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500">Nenhuma conta conectada</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Financeiro
          </h1>
          <p className="mt-1 text-lg text-gray-700 dark:text-gray-300">
            Visão geral do seu faturamento e custos
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={!stats?.periods || stats.periods.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
          <Button
            variant="outline"
            onClick={handleSync}
            disabled={syncing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Sincronizar'}
          </Button>
        </div>
      </div>

      {/* Note about data source */}
      {stats?.note && (
        <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            ℹ️ {stats.note}
          </p>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {/* Faturamento Bruto */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Bruto</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-8 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(stats?.totalRevenue || 0)}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Média: {formatCurrency(stats?.avgRevenue || 0)}/mês
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Taxas e Impostos */}
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxas + Impostos</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-8 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            ) : (
              <>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  -{formatCurrency((stats?.totalFees || 0) + (stats?.totalTaxes || 0))}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Taxas: {formatCurrency(stats?.totalFees || 0)} | Impostos: {formatCurrency(stats?.totalTaxes || 0)}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Faturamento Líquido */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Líquido</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-8 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(stats?.totalNet || 0)}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Média: {formatCurrency(stats?.avgNet || 0)}/mês
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Margem de Lucro */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem de Lucro</CardTitle>
            <Percent className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-8 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            ) : (
              <>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {stats?.profitMargin.toFixed(1)}%
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {stats?.periodsCount || 0} períodos analisados
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Despesas Fixas */}
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas Fixas</CardTitle>
            <Receipt className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {expensesSummary ? (
              <>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  -{formatCurrency(expensesSummary.total || 0)}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {expensesSummary.summary?.length || 0} despesas cadastradas
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  R$ 0,00
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Nenhuma despesa cadastrada
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Faturamento */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Evolução do Faturamento</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowChart(!showChart)}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              {showChart ? 'Ocultar' : 'Mostrar'} Gráfico
            </Button>
          </CardHeader>
          {showChart && (
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                {/* @ts-ignore - Recharts types issue */}
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis 
                    dataKey="name" 
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                    tickFormatter={(value: any) => `R$ ${(value / 1000).toFixed(1)}k`}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'var(--background)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="Faturamento Bruto" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Faturamento Líquido" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          )}
        </Card>
      )}

      {/* Tabela de Períodos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Períodos de Faturamento</CardTitle>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar período..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-48"
            />
          </div>
        </CardHeader>
        <CardContent>
          {periodsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              ))}
            </div>
          ) : filteredPeriods.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Período
                    </th>
                    <th className="pb-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                      Faturamento
                    </th>
                    <th className="pb-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                      Líquido
                    </th>
                    <th className="pb-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                      Margem
                    </th>
                    {filteredPeriods[0]?.orderCount !== undefined && (
                      <th className="pb-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                        Pedidos
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredPeriods.map((period, index) => {
                    const margin = period.totalAmount > 0 
                      ? ((period.netAmount / period.totalAmount) * 100).toFixed(1)
                      : '0.0';
                    
                    return (
                      <tr
                        key={period.periodKey}
                        className={`border-b border-gray-100 dark:border-gray-800 ${
                          index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900/50' : ''
                        }`}
                      >
                        <td className="py-3 text-sm font-medium text-gray-900 dark:text-white">
                          {formatPeriodKey(period.periodKey)}
                        </td>
                        <td className="py-3 text-right text-sm text-gray-900 dark:text-white">
                          {formatCurrency(period.totalAmount)}
                        </td>
                        <td className="py-3 text-right text-sm font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(period.netAmount)}
                        </td>
                        <td className="py-3 text-right text-sm text-gray-900 dark:text-white">
                          {margin}%
                        </td>
                        {period.orderCount !== undefined && (
                          <td className="py-3 text-right text-sm text-gray-600 dark:text-gray-400">
                            {period.orderCount}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Nenhum período encontrado. Clique em "Sincronizar" para buscar dados.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Breakdown de Custos e Produtos Rentáveis */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Breakdown de Custos (Gráfico Pizza) */}
        {breakdown && (
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Custos</CardTitle>
            </CardHeader>
            <CardContent>
              {breakdownLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  {/* @ts-ignore - Recharts types issue */}
                  <PieChart>
                    <Pie
                      data={breakdown.breakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {breakdown.breakdown.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        )}

        {/* Top 5 Produtos Mais Rentáveis */}
        {profitability && profitability.topProducts && profitability.topProducts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Top 5 Produtos Mais Rentáveis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profitabilityLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {profitability.topProducts.slice(0, 5).map((product: any, index: number) => (
                    <div
                      key={product.itemId}
                      className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                            {index + 1}
                          </span>
                          <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                            {product.title}
                          </p>
                        </div>
                        <div className="mt-1 flex gap-4 text-xs text-gray-600 dark:text-gray-400">
                          <span>{product.orderCount} vendas</span>
                          <span>Margem: {product.profitMargin.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(product.netRevenue)}
                        </p>
                        <p className="text-xs text-gray-500">
                          de {formatCurrency(product.totalRevenue)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Despesas Fixas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Despesas Fixas Mensais
          </CardTitle>
          <Button onClick={() => setShowExpenseModal(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nova Despesa
          </Button>
        </CardHeader>
        <CardContent>
          {expenses && expenses.length > 0 ? (
            <div className="space-y-2">
              {expenses.map((expense: any) => (
                <div key={expense.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{expense.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{expense.category}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(expense.amount)}</span>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteExpense(expense.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="mt-4 border-t border-gray-200 pt-3 dark:border-gray-700">
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-gray-900 dark:text-white">Total Mensal:</span>
                  <span className="text-red-600 dark:text-red-400">{formatCurrency(expensesSummary?.total || 0)}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="py-8 text-center text-gray-500 dark:text-gray-400">
              Nenhuma despesa cadastrada. Clique em "Nova Despesa" para começar.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Modal Criar Despesa */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowExpenseModal(false)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Nova Despesa Fixa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">Nome *</label>
                <Input
                  value={newExpense.name}
                  onChange={(e) => setNewExpense({...newExpense, name: e.target.value})}
                  placeholder="Ex: Contador"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">Categoria *</label>
                <select
                  className="mt-1 w-full rounded-md border border-gray-300 p-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                >
                  <option value="CONTADOR">Contador</option>
                  <option value="EMBALAGEM">Embalagens</option>
                  <option value="ALUGUEL">Aluguel</option>
                  <option value="MARKETING">Marketing</option>
                  <option value="OUTROS">Outros</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">Valor Mensal (R$) *</label>
                <Input
                  type="number"
                  step="0.01"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({...newExpense, amount: parseFloat(e.target.value) || 0})}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">Descrição (opcional)</label>
                <Input
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                  placeholder="Detalhes adicionais"
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleCreateExpense} className="flex-1" disabled={createExpense.isPending}>
                  {createExpense.isPending ? 'Criando...' : 'Criar Despesa'}
                </Button>
                <Button variant="outline" onClick={() => setShowExpenseModal(false)} className="flex-1">
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
