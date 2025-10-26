"use client";
import { useEffect, useState } from "react";
import { RefreshCw, ShoppingCart, ExternalLink, User, Package, LayoutGrid, Table } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Order = {
  id: string;
  meliOrderId: string;
  status: string;
  totalAmount: number;
  dateCreated: string;
  buyerId: string | null;
  buyerNickname: string | null;
  itemId: string | null;
  itemTitle: string | null;
  itemPermalink: string | null;
  updatedAt: string;
};

export default function OrdersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  const totalAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/orders`, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 404) {
          setError("Endpoint /orders não implementado ainda");
          setLoading(false);
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      setOrders(json.items || []);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [apiBase]);

  const statusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-500 text-white font-semibold";
      case "confirmed":
        return "bg-blue-500 text-white font-semibold";
      case "cancelled":
        return "bg-red-500 text-white font-semibold";
      case "pending":
        return "bg-amber-500 text-white font-semibold";
      default:
        return "bg-gray-500 text-white font-semibold";
    }
  };

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Pedidos Recentes
          </h1>
          <p className="mt-1 text-lg text-gray-700 dark:text-gray-300">
            Acompanhe suas vendas no Mercado Livre
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-gradient-to-br from-green-50 to-white border-l-4 border-l-green-500 px-4 py-2 dark:from-green-950 dark:to-gray-900">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Pedidos:</span>{' '}
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {orders.length}
            </span>
          </div>
          <div className="rounded-lg bg-gradient-to-br from-blue-50 to-white border-l-4 border-l-blue-500 px-4 py-2 dark:from-blue-950 dark:to-gray-900">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Valor Total:</span>{' '}
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              R$ {totalAmount.toFixed(2)}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'table' ? 'primary' : 'outline'}
              onClick={() => setViewMode('table')}
              size="sm"
            >
              <Table className="mr-2 h-4 w-4" />
              Tabela
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'primary' : 'outline'}
              onClick={() => setViewMode('cards')}
              size="sm"
            >
              <LayoutGrid className="mr-2 h-4 w-4" />
              Cards
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={fetchOrders}
            disabled={loading}
            size="sm"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-gray-900">
          <CardContent className="flex items-center gap-3 p-8 justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              Carregando pedidos...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-l-4 border-l-red-500 bg-gradient-to-br from-red-50 to-white dark:from-red-950 dark:to-gray-900">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-red-500 p-3">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  Erro ao carregar pedidos
                </p>
                <p className="mt-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {error}
                </p>
                <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  Dica: Execute o backfill primeiro ou verifique se o endpoint está implementado
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && orders.length === 0 && (
        <Card className="border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950 dark:to-gray-900">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 inline-block rounded-lg bg-amber-500 p-4">
              <ShoppingCart className="h-8 w-8 text-white" />
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              Nenhum pedido sincronizado ainda
            </p>
            <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Execute o backfill para importar seus pedidos do Mercado Livre
            </p>
          </CardContent>
        </Card>
      )}

      {/* Orders Table */}
      {!loading && !error && orders.length > 0 && viewMode === 'table' && (
        <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-gray-900">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b-2 border-green-500 bg-gradient-to-r from-green-100 to-green-50 dark:from-green-900 dark:to-green-950">
                  <tr>
                    <th className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                      Order ID
                    </th>
                    <th className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                      Produto
                    </th>
                    <th className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                      Comprador
                    </th>
                    <th className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                      Status
                    </th>
                    <th className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                      Valor
                    </th>
                    <th className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-green-100 transition-all hover:bg-green-100 dark:border-green-900 dark:hover:bg-green-900/50"
                    >
                      <td className="px-6 py-4 font-mono text-sm font-semibold text-gray-900 dark:text-white">
                        {order.meliOrderId}
                      </td>
                      <td className="px-6 py-4">
                        {order.itemTitle ? (
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-blue-500" />
                            <div className="flex-1">
                              <p className="font-bold text-gray-900 dark:text-white line-clamp-1">
                                {order.itemTitle}
                              </p>
                              {order.itemPermalink && (
                                <a
                                  href={order.itemPermalink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                                >
                                  Ver anúncio
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {order.buyerNickname ? (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-purple-500" />
                            <span className="font-bold text-gray-900 dark:text-white">
                              {order.buyerNickname}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${statusColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-lg font-bold text-green-600 dark:text-green-400">
                        R$ {order.totalAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-700 dark:text-gray-300">
                        {new Date(order.dateCreated).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders Cards */}
      {!loading && !error && orders.length > 0 && viewMode === 'cards' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {orders.map((order) => (
            <Card 
              key={order.id}
              className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-gray-900 hover:shadow-lg transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge 
                    variant={order.status === 'paid' ? 'success' : order.status === 'cancelled' ? 'danger' : 'default'}
                    className="text-xs"
                  >
                    {order.status}
                  </Badge>
                  <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
                    #{order.meliOrderId.slice(-6)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Produto */}
                {order.itemTitle && (
                  <div>
                    <div className="flex items-start gap-2">
                      <Package className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2">
                          {order.itemTitle}
                        </p>
                        {order.itemPermalink && (
                          <a
                            href={order.itemPermalink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 mt-1"
                          >
                            Ver anúncio
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Comprador */}
                {order.buyerNickname && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-purple-500 flex-shrink-0" />
                    <span className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                      {order.buyerNickname}
                    </span>
                  </div>
                )}

                {/* Valor */}
                <div className="pt-2 border-t border-green-200 dark:border-green-800">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Valor</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    R$ {order.totalAmount.toFixed(2)}
                  </p>
                </div>

                {/* Data */}
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {new Date(order.dateCreated).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
