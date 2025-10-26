"use client";
import { useEffect, useState } from "react";
import { RefreshCw, Package, Clock, AlertTriangle, CheckCircle, Truck, User, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type PendingShipment = {
  id: string;
  meliShipmentId: string;
  orderId: string | null;
  status: string;
  substatus: string | null;
  slaStatus: string | null;
  slaService: string | null;
  slaExpectedDate: string | null;
  handlingLimit: string | null;
  deliveryLimit: string | null;
  trackingNumber: string | null;
  receiverAddress: string | null;
  cost: number | null;
  updatedAt: string;
  createdAt: string;
  order: {
    id: string;
    meliOrderId: string;
    buyerNickname: string | null;
    itemTitle: string | null;
    itemPermalink: string | null;
    totalAmount: number;
    dateCreated: string;
  } | null;
};

type Stats = {
  total: number;
  onTime: number;
  delayed: number;
  urgent: number;
};

export default function PendingShipmentsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shipments, setShipments] = useState<PendingShipment[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
  const accountId = typeof window !== 'undefined' ? localStorage.getItem("accountId") : null;

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [shipmentsRes, statsRes] = await Promise.all([
        fetch(`${apiBase}/pending-shipments?accountId=${accountId}`, { credentials: "include" }),
        fetch(`${apiBase}/pending-shipments/stats?accountId=${accountId}`, { credentials: "include" }),
      ]);

      if (!shipmentsRes.ok || !statsRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const shipmentsData = await shipmentsRes.json();
      const statsData = await statsRes.json();

      setShipments(shipmentsData.items || []);
      setStats(statsData);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accountId) {
      fetchData();
    }
  }, [apiBase, accountId]);

  const getUrgencyLevel = (slaExpectedDate: string | null) => {
    if (!slaExpectedDate) return "normal";
    
    const deadline = new Date(slaExpectedDate);
    const now = new Date();
    const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilDeadline < 0) return "overdue";
    if (hoursUntilDeadline < 6) return "critical";
    if (hoursUntilDeadline < 24) return "urgent";
    return "normal";
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "overdue":
        return "bg-red-500 text-white";
      case "critical":
        return "bg-orange-500 text-white";
      case "urgent":
        return "bg-yellow-500 text-white";
      default:
        return "bg-green-500 text-white";
    }
  };

  const formatTimeRemaining = (slaExpectedDate: string | null) => {
    if (!slaExpectedDate) return "Sem prazo definido";
    
    const deadline = new Date(slaExpectedDate);
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();

    if (diff < 0) {
      const hours = Math.abs(Math.floor(diff / (1000 * 60 * 60)));
      return `Atrasado ${hours}h`;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours < 24) {
      return `${hours}h ${minutes}m restantes`;
    }

    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h restantes`;
  };

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Próximos Envios
          </h1>
          <p className="mt-1 text-lg text-gray-700 dark:text-gray-300">
            Gerencie os prazos de despacho dos seus pedidos
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchData}
          disabled={loading}
          size="sm"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-gray-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Total Pendentes
              </CardTitle>
              <Package className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.total}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-gray-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                No Prazo
              </CardTitle>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.onTime}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500 bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-950 dark:to-gray-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Urgentes (&lt;24h)
              </CardTitle>
              <Clock className="h-5 w-5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.urgent}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500 bg-gradient-to-br from-red-50 to-white dark:from-red-950 dark:to-gray-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Atrasados
              </CardTitle>
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.delayed}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-8 text-center">
            <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-500" />
            <p className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
              Carregando envios pendentes...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {!loading && error && (
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-red-500" />
            <p className="mt-4 text-lg font-bold text-gray-900 dark:text-white">
              Erro ao carregar dados
            </p>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && shipments.length === 0 && (
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-8 text-center">
            <CheckCircle className="mx-auto h-8 w-8 text-green-500" />
            <p className="mt-4 text-lg font-bold text-gray-900 dark:text-white">
              Nenhum envio pendente! 🎉
            </p>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              Todos os pedidos foram despachados
            </p>
          </CardContent>
        </Card>
      )}

      {/* Shipments Grid */}
      {!loading && !error && shipments.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shipments.map((shipment) => {
            const urgency = getUrgencyLevel(shipment.slaExpectedDate);
            const urgencyColor = getUrgencyColor(urgency);

            return (
              <Card
                key={shipment.id}
                className={`border-l-4 ${
                  urgency === 'overdue' ? 'border-l-red-500' :
                  urgency === 'critical' ? 'border-l-orange-500' :
                  urgency === 'urgent' ? 'border-l-yellow-500' :
                  'border-l-green-500'
                } hover:shadow-lg transition-shadow`}
              >
                <CardHeader className="pb-3">
                  <div className="space-y-2">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-blue-500" />
                        <span className="font-mono text-xs font-semibold text-gray-900 dark:text-white">
                          #{shipment.meliShipmentId.slice(-8)}
                        </span>
                      </div>
                      <Badge className={`${urgencyColor} text-xs`}>
                        {urgency === 'overdue' ? 'ATRASADO' :
                         urgency === 'critical' ? 'CRÍTICO' :
                         urgency === 'urgent' ? 'URGENTE' :
                         'OK'}
                      </Badge>
                    </div>
                    {shipment.slaService && (
                      <Badge variant="info" className="text-xs w-fit">
                        {shipment.slaService}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Product Info */}
                  {shipment.order?.itemTitle && (
                    <div>
                      <div className="flex items-start gap-2">
                        <Package className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2">
                            {shipment.order.itemTitle}
                          </p>
                          {shipment.order.itemPermalink && (
                            <a
                              href={shipment.order.itemPermalink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 mt-1"
                            >
                              Ver anúncio
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Buyer Info */}
                  {shipment.order?.buyerNickname && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                        {shipment.order.buyerNickname}
                      </span>
                    </div>
                  )}

                  {/* Deadline */}
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-3 w-3 text-gray-500" />
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                        Prazo de Despacho
                      </span>
                    </div>
                    {shipment.slaExpectedDate ? (
                      <>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {new Date(shipment.slaExpectedDate).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <p className={`text-xs font-semibold mt-1 ${
                          urgency === 'overdue' ? 'text-red-600' :
                          urgency === 'critical' ? 'text-orange-600' :
                          urgency === 'urgent' ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {formatTimeRemaining(shipment.slaExpectedDate)}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-gray-500">Sem prazo definido</p>
                    )}
                  </div>

                  {/* Tracking */}
                  {shipment.trackingNumber && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      <span className="font-mono">{shipment.trackingNumber}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
