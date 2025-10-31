import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, Package, User, Clock, ExternalLink } from "lucide-react";

type ShipmentCardProps = {
  shipment: any;
  urgency: string;
  urgencyColor: string;
  formatTimeRemaining: (date: string | null) => string;
};

export function ShipmentCard({ shipment, urgency, urgencyColor, formatTimeRemaining }: ShipmentCardProps) {
  return (
    <Card className={`border-l-4 ${
      urgency === 'overdue' ? 'border-l-red-500' :
      urgency === 'critical' ? 'border-l-orange-500' :
      urgency === 'urgent' ? 'border-l-yellow-500' :
      'border-l-green-500'
    } hover:shadow-lg transition-shadow`}>
      <CardHeader className="pb-3">
        <div className="space-y-2">
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

        {shipment.order?.buyerNickname && (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-green-500 flex-shrink-0" />
            <span className="text-xs font-semibold text-gray-900 dark:text-white truncate">
              {shipment.order.buyerNickname}
            </span>
          </div>
        )}

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

        {shipment.trackingNumber && (
          <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
            <span className="font-mono">{shipment.trackingNumber}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
