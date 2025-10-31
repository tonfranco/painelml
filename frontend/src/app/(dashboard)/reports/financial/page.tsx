'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Percent,
  Calendar,
  Download,
  FileSpreadsheet,
  FileDown,
  Filter
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { exportFinancialReport } from '@/lib/exportService';
import { useFinancialStats } from '@/hooks/useFinancial';
import { useExpensesSummary } from '@/hooks/useExpenses';
import { useTaxesSummary } from '@/hooks/useTaxes';
import toast from 'react-hot-toast';

export default function FinancialReportPage() {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [months, setMonths] = useState(6);

  useEffect(() => {
    setMounted(true);
    setAccountId(localStorage.getItem('accountId'));
  }, []);

  const { data: stats, isLoading: statsLoading, refetch } = useFinancialStats(accountId, months);
  const { data: expensesSummary } = useExpensesSummary(accountId);
  const { data: taxesSummary } = useTaxesSummary(accountId);

  const handleExport = (format: 'excel' | 'csv' | 'pdf') => {
    if (!stats) {
      toast.error('Aguarde o carregamento dos dados');
      return;
    }

    try {
      exportFinancialReport(
        stats,
        stats.periods || [],
        [],
        [],
        format
      );
      toast.success(`Relatório exportado em ${format.toUpperCase()}!`);
    } catch (error) {
      toast.error('Erro ao exportar relatório');
      console.error(error);
    }
  };

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500" />
      </div>
    );
  }

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
            Relatório Financeiro
          </h1>
          <p className="mt-1 text-lg text-gray-700 dark:text-gray-300">
            Análise completa da saúde financeira
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleExport('excel')}
            disabled={!stats}
            size="sm"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('csv')}
            disabled={!stats}
            size="sm"
          >
            <FileDown className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('pdf')}
            disabled={!stats}
            size="sm"
          >
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Últimos meses</label>
              <Input
                type="number"
                min="1"
                max="24"
                value={months}
                onChange={(e) => setMonths(parseInt(e.target.value) || 6)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={() => refetch()} disabled={statsLoading}>
                <Calendar className="mr-2 h-4 w-4" />
                Atualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {statsLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500" />
        </div>
      ) : stats ? (
        <>
          {/* Cards de Resumo */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Faturamento Bruto</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">últimos {months} meses</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxas ML/MP</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalFees)}</div>
                <p className="text-xs text-muted-foreground">
                  {((stats.totalFees / stats.totalRevenue) * 100).toFixed(1)}% do faturamento
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Faturamento Líquido</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalNet)}</div>
                <p className="text-xs text-muted-foreground">após taxas e impostos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Margem de Lucro</CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.profitMargin.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">margem líquida</p>
              </CardContent>
            </Card>
          </div>

          {/* Despesas e Impostos */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Despesas Fixas</CardTitle>
              </CardHeader>
              <CardContent>
                {expensesSummary ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Total Mensal:</span>
                      <span className="font-bold">{formatCurrency(expensesSummary.totalMonthly)}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {expensesSummary.totalExpenses} despesa(s) cadastrada(s)
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma despesa cadastrada</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Impostos e Taxas</CardTitle>
              </CardHeader>
              <CardContent>
                {taxesSummary ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Total:</span>
                      <span className="font-bold">{formatCurrency(taxesSummary.totalAmount)}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {taxesSummary.totalTaxes} imposto(s)/taxa(s) cadastrado(s)
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum imposto/taxa cadastrado</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Períodos de Faturamento */}
          <Card>
            <CardHeader>
              <CardTitle>Faturamento por Período</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.periods && stats.periods.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Período</th>
                          <th className="text-right py-2">Faturamento Bruto</th>
                          <th className="text-right py-2">Faturamento Líquido</th>
                          <th className="text-right py-2">Margem</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.periods.slice(0, 12).map((period: any) => (
                          <tr key={period.periodKey} className="border-b">
                            <td className="py-2">{period.periodKey}</td>
                            <td className="text-right">{formatCurrency(period.totalAmount)}</td>
                            <td className="text-right">{formatCurrency(period.netAmount)}</td>
                            <td className="text-right">
                              {((period.netAmount / period.totalAmount) * 100).toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum período disponível</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Indicadores */}
          <Card>
            <CardHeader>
              <CardTitle>Indicadores Financeiros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">ROI (Retorno sobre Investimento)</p>
                  <p className="text-2xl font-bold">
                    {stats.totalNet > 0 ? ((stats.totalNet / stats.totalRevenue) * 100).toFixed(1) : '0.0'}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Custo de Aquisição</p>
                  <p className="text-2xl font-bold">
                    {((stats.totalFees / stats.totalRevenue) * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lucro Líquido</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(stats.totalNet - (expensesSummary?.totalMonthly || 0) * months)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="flex h-64 items-center justify-center">
            <p className="text-muted-foreground">Nenhum dado disponível</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
