'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ShoppingCart, 
  TrendingUp, 
  DollarSign, 
  Package,
  Calendar,
  Download,
  FileSpreadsheet,
  FileDown,
  Filter
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { exportToExcel, exportToCSV, exportToPDF } from '@/lib/exportService';
import toast from 'react-hot-toast';

export default function SalesReportPage() {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  const [salesData, setSalesData] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    setAccountId(localStorage.getItem('accountId'));
  }, []);

  useEffect(() => {
    if (accountId) {
      fetchSalesData();
    }
  }, [accountId, dateRange]);

  const fetchSalesData = async () => {
    setLoading(true);
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
      const response = await fetch(
        `${API_BASE_URL}/orders?accountId=${accountId}&startDate=${dateRange.start}&endDate=${dateRange.end}`
      );
      
      if (!response.ok) throw new Error('Erro ao buscar dados');
      
      const orders = await response.json();
      
      // Calcular estatísticas
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0);
      const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
      // Agrupar por status
      const byStatus = orders.reduce((acc: any, order: any) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {});
      
      // Agrupar por dia
      const byDate = orders.reduce((acc: any, order: any) => {
        const date = new Date(order.dateCreated).toLocaleDateString('pt-BR');
        if (!acc[date]) {
          acc[date] = { date, count: 0, revenue: 0 };
        }
        acc[date].count++;
        acc[date].revenue += order.totalAmount || 0;
        return acc;
      }, {});
      
      // Top produtos (baseado em itemTitle do pedido)
      const productSales: any = {};
      orders.forEach((order: any) => {
        if (order.itemTitle) {
          if (!productSales[order.itemTitle]) {
            productSales[order.itemTitle] = { 
              title: order.itemTitle, 
              quantity: 0, 
              revenue: 0,
              itemId: order.itemId 
            };
          }
          productSales[order.itemTitle].quantity += 1; // Cada pedido = 1 item
          productSales[order.itemTitle].revenue += order.totalAmount || 0;
        }
      });
      
      const topProducts = Object.values(productSales)
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 10);
      
      setSalesData({
        totalOrders,
        totalRevenue,
        averageTicket,
        byStatus,
        byDate: Object.values(byDate),
        topProducts,
        orders,
      });
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao carregar relatório de vendas');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'excel' | 'csv' | 'pdf') => {
    if (!salesData) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    try {
      const filename = `relatorio-vendas-${dateRange.start}-${dateRange.end}`;
      
      if (format === 'excel') {
        exportToExcel(salesData.orders, filename, 'Vendas');
      } else if (format === 'csv') {
        exportToCSV(salesData.orders, filename);
      } else if (format === 'pdf') {
        const columns = [
          { header: 'ID', dataKey: 'id' },
          { header: 'Data', dataKey: 'dateCreated' },
          { header: 'Status', dataKey: 'status' },
          { header: 'Total', dataKey: 'totalAmount' },
        ];
        exportToPDF(salesData.orders, columns, filename, 'Relatório de Vendas');
      }
      
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
            Relatório de Vendas
          </h1>
          <p className="mt-1 text-lg text-gray-700 dark:text-gray-300">
            Análise detalhada das suas vendas
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleExport('excel')}
            disabled={!salesData}
            size="sm"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('csv')}
            disabled={!salesData}
            size="sm"
          >
            <FileDown className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('pdf')}
            disabled={!salesData}
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
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Data Inicial</label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Data Final</label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={fetchSalesData} disabled={loading}>
                <Calendar className="mr-2 h-4 w-4" />
                Aplicar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500" />
        </div>
      ) : salesData ? (
        <>
          {/* Cards de Resumo */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{salesData.totalOrders}</div>
                <p className="text-xs text-muted-foreground">pedidos no período</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(salesData.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">receita bruta</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(salesData.averageTicket)}</div>
                <p className="text-xs text-muted-foreground">por pedido</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Produtos Vendidos</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {salesData.orders.length}
                </div>
                <p className="text-xs text-muted-foreground">pedidos</p>
              </CardContent>
            </Card>
          </div>

          {/* Top 10 Produtos */}
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Produtos Mais Vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {salesData.topProducts.length > 0 ? (
                  salesData.topProducts.map((product: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{product.title}</p>
                        <p className="text-sm text-muted-foreground">{product.quantity} pedidos</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(product.revenue)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground">Nenhum produto encontrado</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Vendas por Status */}
          <Card>
            <CardHeader>
              <CardTitle>Vendas por Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(salesData.byStatus).map(([status, count]: [string, any]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="capitalize">{status}</span>
                    <span className="font-bold">{count} pedidos</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="flex h-64 items-center justify-center">
            <p className="text-muted-foreground">Nenhum dado disponível para o período selecionado</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
