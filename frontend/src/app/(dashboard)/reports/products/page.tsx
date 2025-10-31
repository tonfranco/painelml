'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, TrendingUp, AlertTriangle, DollarSign, Download, FileSpreadsheet, FileDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { exportToExcel, exportToCSV, exportToPDF } from '@/lib/exportService';
import toast from 'react-hot-toast';

export default function ProductsReportPage() {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [productsData, setProductsData] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    setAccountId(localStorage.getItem('accountId'));
  }, []);

  useEffect(() => {
    if (accountId) {
      fetchProductsData();
    }
  }, [accountId]);

  const fetchProductsData = async () => {
    setLoading(true);
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
      const response = await fetch(`${API_BASE_URL}/products?accountId=${accountId}`);
      
      if (!response.ok) throw new Error('Erro ao buscar produtos');
      
      const products = await response.json();
      
      const totalProducts = products.length;
      const activeProducts = products.filter((p: any) => p.status === 'active').length;
      const pausedProducts = products.filter((p: any) => p.status === 'paused').length;
      const lowStockProducts = products.filter((p: any) => p.availableQuantity < 5).length;
      
      const totalValue = products.reduce((sum: number, p: any) => 
        sum + (p.price * p.availableQuantity), 0
      );
      
      setProductsData({
        totalProducts,
        activeProducts,
        pausedProducts,
        lowStockProducts,
        totalValue,
        products,
      });
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      toast.error('Erro ao carregar relatório de produtos');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'excel' | 'csv' | 'pdf') => {
    if (!productsData) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    try {
      const filename = `relatorio-produtos-${new Date().toISOString().split('T')[0]}`;
      
      if (format === 'excel') {
        exportToExcel(productsData.products, filename, 'Produtos');
      } else if (format === 'csv') {
        exportToCSV(productsData.products, filename);
      } else if (format === 'pdf') {
        const columns = [
          { header: 'Título', dataKey: 'title' },
          { header: 'Preço', dataKey: 'price' },
          { header: 'Estoque', dataKey: 'availableQuantity' },
          { header: 'Status', dataKey: 'status' },
        ];
        exportToPDF(productsData.products, columns, filename, 'Relatório de Produtos');
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Relatório de Produtos</h1>
          <p className="mt-1 text-lg text-gray-700 dark:text-gray-300">Análise do catálogo de produtos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('excel')} disabled={!productsData} size="sm">
            <FileSpreadsheet className="mr-2 h-4 w-4" />Excel
          </Button>
          <Button variant="outline" onClick={() => handleExport('csv')} disabled={!productsData} size="sm">
            <FileDown className="mr-2 h-4 w-4" />CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')} disabled={!productsData} size="sm">
            <Download className="mr-2 h-4 w-4" />PDF
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500" />
        </div>
      ) : productsData ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{productsData.totalProducts}</div>
                <p className="text-xs text-muted-foreground">no catálogo</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Produtos Ativos</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{productsData.activeProducts}</div>
                <p className="text-xs text-muted-foreground">{productsData.pausedProducts} pausados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{productsData.lowStockProducts}</div>
                <p className="text-xs text-muted-foreground">produtos com menos de 5 unidades</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Total do Estoque</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(productsData.totalValue)}</div>
                <p className="text-xs text-muted-foreground">valor estimado</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Produtos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Produto</th>
                      <th className="text-right py-2">Preço</th>
                      <th className="text-right py-2">Estoque</th>
                      <th className="text-center py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productsData.products.slice(0, 20).map((product: any) => (
                      <tr key={product.id} className="border-b">
                        <td className="py-2">{product.title}</td>
                        <td className="text-right">{formatCurrency(product.price)}</td>
                        <td className="text-right">
                          <span className={product.availableQuantity < 5 ? 'text-yellow-600 font-bold' : ''}>
                            {product.availableQuantity}
                          </span>
                        </td>
                        <td className="text-center">
                          <span className={`px-2 py-1 rounded text-xs ${
                            product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {product.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="flex h-64 items-center justify-center">
            <p className="text-muted-foreground">Nenhum produto disponível</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
