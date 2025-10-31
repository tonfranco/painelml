'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bus, Clock, CheckCircle, AlertTriangle, Download, FileSpreadsheet, FileDown } from 'lucide-react';
import { exportToExcel, exportToCSV, exportToPDF } from '@/lib/exportService';
import toast from 'react-hot-toast';

export default function ShipmentsReportPage() {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shipmentsData, setShipmentsData] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    setAccountId(localStorage.getItem('accountId'));
  }, []);

  useEffect(() => {
    if (accountId) {
      fetchShipmentsData();
    }
  }, [accountId]);

  const fetchShipmentsData = async () => {
    setLoading(true);
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
      const response = await fetch(`${API_BASE_URL}/shipments/pending?accountId=${accountId}`);
      
      if (!response.ok) throw new Error('Erro ao buscar envios');
      
      const shipments = await response.json();
      
      const totalShipments = shipments.length;
      const pendingShipments = shipments.filter((s: any) => s.status === 'pending').length;
      const shippedShipments = shipments.filter((s: any) => s.status === 'shipped').length;
      const deliveredShipments = shipments.filter((s: any) => s.status === 'delivered').length;
      
      // Calcular envios atrasados
      const now = new Date();
      const overdueShipments = shipments.filter((s: any) => {
        if (s.status !== 'pending') return false;
        const handlingDeadline = new Date(s.handlingDeadline);
        return handlingDeadline < now;
      }).length;
      
      setShipmentsData({
        totalShipments,
        pendingShipments,
        shippedShipments,
        deliveredShipments,
        overdueShipments,
        shipments,
      });
    } catch (error) {
      console.error('Erro ao buscar envios:', error);
      toast.error('Erro ao carregar relatório de envios');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'excel' | 'csv' | 'pdf') => {
    if (!shipmentsData) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    try {
      const filename = `relatorio-envios-${new Date().toISOString().split('T')[0]}`;
      
      if (format === 'excel') {
        exportToExcel(shipmentsData.shipments, filename, 'Envios');
      } else if (format === 'csv') {
        exportToCSV(shipmentsData.shipments, filename);
      } else if (format === 'pdf') {
        const columns = [
          { header: 'ID', dataKey: 'id' },
          { header: 'Status', dataKey: 'status' },
          { header: 'Prazo', dataKey: 'handlingDeadline' },
        ];
        exportToPDF(shipmentsData.shipments, columns, filename, 'Relatório de Envios');
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Relatório de Envios</h1>
          <p className="mt-1 text-lg text-gray-700 dark:text-gray-300">Status e performance de entregas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('excel')} disabled={!shipmentsData} size="sm">
            <FileSpreadsheet className="mr-2 h-4 w-4" />Excel
          </Button>
          <Button variant="outline" onClick={() => handleExport('csv')} disabled={!shipmentsData} size="sm">
            <FileDown className="mr-2 h-4 w-4" />CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')} disabled={!shipmentsData} size="sm">
            <Download className="mr-2 h-4 w-4" />PDF
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500" />
        </div>
      ) : shipmentsData ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Envios</CardTitle>
                <Bus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{shipmentsData.totalShipments}</div>
                <p className="text-xs text-muted-foreground">envios registrados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{shipmentsData.pendingShipments}</div>
                <p className="text-xs text-muted-foreground">aguardando envio</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Enviados</CardTitle>
                <Bus className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{shipmentsData.shippedShipments}</div>
                <p className="text-xs text-muted-foreground">em trânsito</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Atrasados</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{shipmentsData.overdueShipments}</div>
                <p className="text-xs text-muted-foreground">fora do prazo</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance de Entregas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Entregues</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-green-600">{shipmentsData.deliveredShipments}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      ({((shipmentsData.deliveredShipments / shipmentsData.totalShipments) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bus className="h-5 w-5 text-blue-500" />
                    <span>Em Trânsito</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-blue-600">{shipmentsData.shippedShipments}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      ({((shipmentsData.shippedShipments / shipmentsData.totalShipments) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-yellow-500" />
                    <span>Pendentes</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-yellow-600">{shipmentsData.pendingShipments}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      ({((shipmentsData.pendingShipments / shipmentsData.totalShipments) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <span>Atrasados</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-red-600">{shipmentsData.overdueShipments}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      ({((shipmentsData.overdueShipments / shipmentsData.totalShipments) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Envios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">ID</th>
                      <th className="text-center py-2">Status</th>
                      <th className="text-right py-2">Prazo de Envio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shipmentsData.shipments.slice(0, 20).map((shipment: any) => {
                      const deadline = new Date(shipment.handlingDeadline);
                      const isOverdue = deadline < new Date() && shipment.status === 'pending';
                      
                      return (
                        <tr key={shipment.id} className="border-b">
                          <td className="py-2">{shipment.id}</td>
                          <td className="text-center">
                            <span className={`px-2 py-1 rounded text-xs ${
                              shipment.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              shipment.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                              isOverdue ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {shipment.status}
                            </span>
                          </td>
                          <td className={`text-right ${isOverdue ? 'text-red-600 font-bold' : ''}`}>
                            {deadline.toLocaleDateString('pt-BR')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="flex h-64 items-center justify-center">
            <p className="text-muted-foreground">Nenhum envio disponível</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
