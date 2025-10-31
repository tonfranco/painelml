'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCashFlowForecast, useBankReconciliation, useDivergenceAlerts } from '@/hooks/useCashFlow';
import { formatCurrency } from '@/lib/utils';
import { exportCashFlowReport } from '@/lib/exportService';
import toast from 'react-hot-toast';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Clock,
  XCircle,
  FileSpreadsheet,
  FileDown,
  Download
} from 'lucide-react';

export default function CashFlowPage() {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setAccountId(localStorage.getItem('accountId'));
  }, []);

  const { data: forecast, isLoading: forecastLoading, refetch: refetchForecast } = useCashFlowForecast(accountId);
  const { data: reconciliation, isLoading: reconciliationLoading, refetch: refetchReconciliation } = useBankReconciliation(accountId);
  const { data: alerts, isLoading: alertsLoading } = useDivergenceAlerts(accountId);

  const handleRefresh = () => {
    refetchForecast();
    refetchReconciliation();
  };

  const handleExport = (format: 'excel' | 'csv' | 'pdf') => {
    if (!forecast || !reconciliation) {
      toast.error('Aguarde o carregamento dos dados');
      return;
    }

    try {
      exportCashFlowReport(forecast, reconciliation, format);
      toast.success(`Relatório exportado em ${format.toUpperCase()}!`);
    } catch (error) {
      toast.error('Erro ao exportar relatório');
      console.error(error);
    }
  };

  // Evitar hydration mismatch - aguardar montagem do componente
  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500" />
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Fluxo de Caixa
          </h1>
          <p className="mt-1 text-lg text-gray-700 dark:text-gray-300">
            Previsão de recebimentos e conciliação bancária
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleExport('excel')}
            disabled={!forecast || !reconciliation}
            size="sm"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('csv')}
            disabled={!forecast || !reconciliation}
            size="sm"
          >
            <FileDown className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('pdf')}
            disabled={!forecast || !reconciliation}
            size="sm"
          >
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={forecastLoading || reconciliationLoading}
            size="sm"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${forecastLoading || reconciliationLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Alertas de Divergências */}
      {alerts && alerts.total > 0 && (
        <Card className="mb-6 border-l-4 border-l-red-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <CardTitle>Alertas de Divergências</CardTitle>
              </div>
              <Badge variant="danger">{alerts.total} alertas</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.alerts.slice(0, 5).map((alert: any, index: number) => (
                <div
                  key={index}
                  className={`flex items-center justify-between rounded-lg border p-3 ${
                    alert.severity === 'high' 
                      ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950' 
                      : 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={`h-4 w-4 ${alert.severity === 'high' ? 'text-red-600' : 'text-yellow-600'}`} />
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {alert.periodKey}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {alert.message}
                      </p>
                    </div>
                  </div>
                  <Badge variant={alert.severity === 'high' ? 'danger' : 'warning'}>
                    {alert.severity === 'high' ? 'Alta' : 'Média'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Previsão de Recebimentos */}
      <div className="mb-6">
        <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
          Previsão de Recebimentos
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Hoje */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hoje</CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              {forecastLoading ? (
                <div className="h-8 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(forecast?.today?.total || 0)}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {forecast?.today?.count || 0} pedidos
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Próximos 7 dias */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próximos 7 dias</CardTitle>
              <Clock className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {forecastLoading ? (
                <div className="h-8 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(forecast?.next7Days?.total || 0)}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {forecast?.next7Days?.count || 0} pedidos
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Próximos 30 dias */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próximos 30 dias</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              {forecastLoading ? (
                <div className="h-8 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(forecast?.next30Days?.total || 0)}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {forecast?.next30Days?.count || 0} pedidos
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Atrasados */}
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atrasados</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              {forecastLoading ? (
                <div className="h-8 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(forecast?.overdue?.total || 0)}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {forecast?.overdue?.count || 0} pedidos
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Conciliação Bancária */}
      <div>
        <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
          Conciliação Bancária
        </h2>
        
        {/* Summary Cards */}
        <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Períodos</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {reconciliation?.summary?.total || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conciliados</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {reconciliation?.summary?.matched || 0}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {reconciliation?.summary?.matchRate?.toFixed(1) || 0}% de taxa
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Divergentes</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {reconciliation?.summary?.divergent || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Divergência</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {formatCurrency(reconciliation?.summary?.totalDivergence || 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reconciliation Table */}
        {reconciliation && reconciliation.items && reconciliation.items.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Detalhamento por Período</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Período</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Esperado</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Recebido</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Diferença</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {reconciliation.items.map((item: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                          {item.periodKey}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-400">
                          {formatCurrency(item.expectedAmount)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-400">
                          {formatCurrency(item.receivedAmount)}
                        </td>
                        <td className={`px-4 py-3 text-right text-sm font-semibold ${
                          item.difference > 0 ? 'text-green-600 dark:text-green-400' :
                          item.difference < 0 ? 'text-red-600 dark:text-red-400' :
                          'text-gray-600 dark:text-gray-400'
                        }`}>
                          {item.difference > 0 ? '+' : ''}{formatCurrency(item.difference)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {item.status === 'matched' ? (
                            <Badge variant="success">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Conciliado
                            </Badge>
                          ) : (
                            <Badge variant="danger">
                              <AlertTriangle className="mr-1 h-3 w-3" />
                              Divergente
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
