"use client";
import { useEffect, useState } from "react";
import { RefreshCw, Package, Clock, AlertTriangle, CheckCircle, Truck, User, ExternalLink, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShipmentCard } from "./ShipmentCard";

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
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
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

  // Filtrar envios por urgência
  const filteredShipments = shipments.filter((shipment) => {
    if (urgencyFilter === "all") return true;
    const urgency = getUrgencyLevel(shipment.slaExpectedDate);
    return urgency === urgencyFilter;
  });

  // Agrupar envios por urgência para layout Kanban
  const groupedShipments = {
    normal: filteredShipments.filter(s => getUrgencyLevel(s.slaExpectedDate) === "normal"),
    urgent: filteredShipments.filter(s => getUrgencyLevel(s.slaExpectedDate) === "urgent"),
    critical: filteredShipments.filter(s => getUrgencyLevel(s.slaExpectedDate) === "critical"),
    overdue: filteredShipments.filter(s => getUrgencyLevel(s.slaExpectedDate) === "overdue"),
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
          <Card 
            className={`border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-gray-900 cursor-pointer transition-all ${urgencyFilter === 'normal' ? 'ring-2 ring-green-500' : 'hover:shadow-lg'}`}
            onClick={() => setUrgencyFilter(urgencyFilter === 'normal' ? 'all' : 'normal')}
          >
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

          <Card 
            className={`border-l-4 border-l-yellow-500 bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-950 dark:to-gray-900 cursor-pointer transition-all ${urgencyFilter === 'urgent' ? 'ring-2 ring-yellow-500' : 'hover:shadow-lg'}`}
            onClick={() => setUrgencyFilter(urgencyFilter === 'urgent' ? 'all' : 'urgent')}
          >
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

          <Card 
            className={`border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950 dark:to-gray-900 cursor-pointer transition-all ${urgencyFilter === 'critical' ? 'ring-2 ring-orange-500' : 'hover:shadow-lg'}`}
            onClick={() => setUrgencyFilter(urgencyFilter === 'critical' ? 'all' : 'critical')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Críticos (&lt;6h)
              </CardTitle>
              <AlertTriangle className="h-5 w-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {groupedShipments.critical.length}
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`border-l-4 border-l-red-500 bg-gradient-to-br from-red-50 to-white dark:from-red-950 dark:to-gray-900 cursor-pointer transition-all ${urgencyFilter === 'overdue' ? 'ring-2 ring-red-500' : 'hover:shadow-lg'}`}
            onClick={() => setUrgencyFilter(urgencyFilter === 'overdue' ? 'all' : 'overdue')}
          >
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

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          variant={urgencyFilter === "all" ? "primary" : "outline"}
          size="sm"
          onClick={() => setUrgencyFilter("all")}
        >
          <Filter className="mr-2 h-4 w-4" />
          Todos ({shipments.length})
        </Button>
        <Button
          variant={urgencyFilter === "normal" ? "primary" : "outline"}
          size="sm"
          onClick={() => setUrgencyFilter("normal")}
          className={urgencyFilter === "normal" ? "bg-green-500 hover:bg-green-600" : ""}
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          No Prazo ({groupedShipments.normal.length})
        </Button>
        <Button
          variant={urgencyFilter === "urgent" ? "primary" : "outline"}
          size="sm"
          onClick={() => setUrgencyFilter("urgent")}
          className={urgencyFilter === "urgent" ? "bg-yellow-500 hover:bg-yellow-600" : ""}
        >
          <Clock className="mr-2 h-4 w-4" />
          Urgentes ({groupedShipments.urgent.length})
        </Button>
        <Button
          variant={urgencyFilter === "critical" ? "primary" : "outline"}
          size="sm"
          onClick={() => setUrgencyFilter("critical")}
          className={urgencyFilter === "critical" ? "bg-orange-500 hover:bg-orange-600" : ""}
        >
          <AlertTriangle className="mr-2 h-4 w-4" />
          Críticos ({groupedShipments.critical.length})
        </Button>
        <Button
          variant={urgencyFilter === "overdue" ? "primary" : "outline"}
          size="sm"
          onClick={() => setUrgencyFilter("overdue")}
          className={urgencyFilter === "overdue" ? "bg-red-500 hover:bg-red-600" : ""}
        >
          <AlertTriangle className="mr-2 h-4 w-4" />
          Atrasados ({groupedShipments.overdue.length})
        </Button>
      </div>

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

      {/* Kanban Layout - Mostrar quando filtro = "all" */}
      {!loading && !error && filteredShipments.length > 0 && urgencyFilter === "all" && (
        <div className="grid gap-4 lg:grid-cols-4">
          {/* Coluna: No Prazo */}
          <div className="space-y-3">
            <div className="sticky top-0 z-10 rounded-lg bg-green-100 p-3 dark:bg-green-900/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <h3 className="font-bold text-green-900 dark:text-green-100">No Prazo</h3>
                </div>
                <Badge className="bg-green-600 text-white">{groupedShipments.normal.length}</Badge>
              </div>
            </div>
            <div className="space-y-3">
              {groupedShipments.normal.map((shipment) => (
                <ShipmentCard
                  key={shipment.id}
                  shipment={shipment}
                  urgency={getUrgencyLevel(shipment.slaExpectedDate)}
                  urgencyColor={getUrgencyColor(getUrgencyLevel(shipment.slaExpectedDate))}
                  formatTimeRemaining={formatTimeRemaining}
                />
              ))}
            </div>
          </div>

          {/* Coluna: Urgentes */}
          <div className="space-y-3">
            <div className="sticky top-0 z-10 rounded-lg bg-yellow-100 p-3 dark:bg-yellow-900/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  <h3 className="font-bold text-yellow-900 dark:text-yellow-100">Urgentes</h3>
                </div>
                <Badge className="bg-yellow-600 text-white">{groupedShipments.urgent.length}</Badge>
              </div>
            </div>
            <div className="space-y-3">
              {groupedShipments.urgent.map((shipment) => (
                <ShipmentCard
                  key={shipment.id}
                  shipment={shipment}
                  urgency={getUrgencyLevel(shipment.slaExpectedDate)}
                  urgencyColor={getUrgencyColor(getUrgencyLevel(shipment.slaExpectedDate))}
                  formatTimeRemaining={formatTimeRemaining}
                />
              ))}
            </div>
          </div>

          {/* Coluna: Críticos */}
          <div className="space-y-3">
            <div className="sticky top-0 z-10 rounded-lg bg-orange-100 p-3 dark:bg-orange-900/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  <h3 className="font-bold text-orange-900 dark:text-orange-100">Críticos</h3>
                </div>
                <Badge className="bg-orange-600 text-white">{groupedShipments.critical.length}</Badge>
              </div>
            </div>
            <div className="space-y-3">
              {groupedShipments.critical.map((shipment) => (
                <ShipmentCard
                  key={shipment.id}
                  shipment={shipment}
                  urgency={getUrgencyLevel(shipment.slaExpectedDate)}
                  urgencyColor={getUrgencyColor(getUrgencyLevel(shipment.slaExpectedDate))}
                  formatTimeRemaining={formatTimeRemaining}
                />
              ))}
            </div>
          </div>

          {/* Coluna: Atrasados */}
          <div className="space-y-3">
            <div className="sticky top-0 z-10 rounded-lg bg-red-100 p-3 dark:bg-red-900/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <h3 className="font-bold text-red-900 dark:text-red-100">Atrasados</h3>
                </div>
                <Badge className="bg-red-600 text-white">{groupedShipments.overdue.length}</Badge>
              </div>
            </div>
            <div className="space-y-3">
              {groupedShipments.overdue.map((shipment) => (
                <ShipmentCard
                  key={shipment.id}
                  shipment={shipment}
                  urgency={getUrgencyLevel(shipment.slaExpectedDate)}
                  urgencyColor={getUrgencyColor(getUrgencyLevel(shipment.slaExpectedDate))}
                  formatTimeRemaining={formatTimeRemaining}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Grid Layout - Mostrar quando filtro específico */}
      {!loading && !error && filteredShipments.length > 0 && urgencyFilter !== "all" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredShipments.map((shipment) => (
            <ShipmentCard
              key={shipment.id}
              shipment={shipment}
              urgency={getUrgencyLevel(shipment.slaExpectedDate)}
              urgencyColor={getUrgencyColor(getUrgencyLevel(shipment.slaExpectedDate))}
              formatTimeRemaining={formatTimeRemaining}
            />
          ))}
        </div>
      )}
    </>
  );
}
