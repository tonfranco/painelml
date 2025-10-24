import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MeliService } from '../meli/meli.service';

@Injectable()
export class ShipmentsService {
  private readonly logger = new Logger(ShipmentsService.name);

  constructor(
    private prisma: PrismaService,
    private meliApi: MeliService,
  ) {}

  /**
   * Busca todos os shipments de uma conta
   */
  async findAll(accountId: string) {
    return this.prisma.shipment.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Busca um shipment específico
   */
  async findOne(id: string) {
    return this.prisma.shipment.findUnique({
      where: { id },
    });
  }

  /**
   * Busca shipment pelo ID do Mercado Livre
   */
  async findByMeliId(meliShipmentId: string) {
    return this.prisma.shipment.findUnique({
      where: { meliShipmentId },
    });
  }

  /**
   * Sincroniza um shipment específico do Mercado Livre
   */
  async syncShipment(accountId: string, shipmentId: string) {
    try {
      this.logger.log(`Syncing shipment ${shipmentId} for account ${accountId}`);

      const shipmentData = await this.meliApi.getShipment(accountId, shipmentId);

      const shipment = await this.prisma.shipment.upsert({
        where: { meliShipmentId: shipmentId },
        create: {
          accountId,
          meliShipmentId: shipmentId,
          orderId: shipmentData.order_id?.toString(),
          mode: shipmentData.mode || 'unknown',
          status: shipmentData.status || 'unknown',
          substatus: shipmentData.substatus,
          trackingNumber: shipmentData.tracking_number,
          trackingMethod: shipmentData.tracking_method,
          estimatedDelivery: shipmentData.estimated_delivery_time?.date
            ? new Date(shipmentData.estimated_delivery_time.date)
            : null,
          shippedDate: shipmentData.status_history?.shipped?.date_shipped
            ? new Date(shipmentData.status_history.shipped.date_shipped)
            : null,
          deliveredDate: shipmentData.status_history?.delivered?.date_delivered
            ? new Date(shipmentData.status_history.delivered.date_delivered)
            : null,
          receiverAddress: shipmentData.receiver_address
            ? JSON.stringify(shipmentData.receiver_address)
            : null,
          senderAddress: shipmentData.sender_address
            ? JSON.stringify(shipmentData.sender_address)
            : null,
          cost: shipmentData.cost || 0,
        },
        update: {
          status: shipmentData.status || 'unknown',
          substatus: shipmentData.substatus,
          trackingNumber: shipmentData.tracking_number,
          trackingMethod: shipmentData.tracking_method,
          estimatedDelivery: shipmentData.estimated_delivery_time?.date
            ? new Date(shipmentData.estimated_delivery_time.date)
            : null,
          shippedDate: shipmentData.status_history?.shipped?.date_shipped
            ? new Date(shipmentData.status_history.shipped.date_shipped)
            : null,
          deliveredDate: shipmentData.status_history?.delivered?.date_delivered
            ? new Date(shipmentData.status_history.delivered.date_delivered)
            : null,
          receiverAddress: shipmentData.receiver_address
            ? JSON.stringify(shipmentData.receiver_address)
            : null,
          senderAddress: shipmentData.sender_address
            ? JSON.stringify(shipmentData.sender_address)
            : null,
          cost: shipmentData.cost || 0,
        },
      });

      this.logger.log(`Shipment ${shipmentId} synced successfully`);
      return shipment;
    } catch (error) {
      this.logger.error(`Error syncing shipment ${shipmentId}:`, error);
      throw error;
    }
  }

  /**
   * Faz backfill de todos os shipments de uma conta
   */
  async backfillShipments(accountId: string) {
    try {
      this.logger.log(`Starting shipments backfill for account ${accountId}`);

      // Busca todos os pedidos da conta
      const orders = await this.prisma.order.findMany({
        where: { accountId },
        select: { meliOrderId: true },
      });

      let syncedCount = 0;
      let errorCount = 0;

      for (const order of orders) {
        try {
          // Busca informações do pedido incluindo shipment
          const orderData = await this.meliApi.getOrder(accountId, order.meliOrderId);

          if (orderData.shipping?.id) {
            await this.syncShipment(accountId, orderData.shipping.id.toString());
            syncedCount++;
          }
        } catch (error) {
          this.logger.error(`Error processing order ${order.meliOrderId}:`, error);
          errorCount++;
        }
      }

      this.logger.log(
        `Shipments backfill completed: ${syncedCount} synced, ${errorCount} errors`,
      );

      return { syncedCount, errorCount };
    } catch (error) {
      this.logger.error('Error in shipments backfill:', error);
      throw error;
    }
  }

  /**
   * Retorna estatísticas de shipments
   */
  async getStats(accountId?: string) {
    const where = accountId ? { accountId } : {};

    const [total, pending, shipped, delivered] = await Promise.all([
      this.prisma.shipment.count({ where }),
      this.prisma.shipment.count({
        where: { ...where, status: { in: ['pending', 'ready_to_ship'] } },
      }),
      this.prisma.shipment.count({
        where: { ...where, status: 'shipped' },
      }),
      this.prisma.shipment.count({
        where: { ...where, status: 'delivered' },
      }),
    ]);

    return {
      total,
      pending,
      shipped,
      delivered,
    };
  }
}
