import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('pending-shipments')
export class PendingShipmentsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query('accountId') accountId?: string) {
    const where: any = {
      status: { in: ['pending', 'handling', 'ready_to_ship'] },
    };

    if (accountId) {
      where.accountId = accountId;
    }

    const shipments = await this.prisma.shipment.findMany({
      where,
      orderBy: { slaExpectedDate: 'asc' },
      take: 100,
      select: {
        id: true,
        meliShipmentId: true,
        orderId: true,
        status: true,
        substatus: true,
        slaStatus: true,
        slaService: true,
        slaExpectedDate: true,
        handlingLimit: true,
        deliveryLimit: true,
        trackingNumber: true,
        receiverAddress: true,
        cost: true,
        updatedAt: true,
        createdAt: true,
      },
    });

    // Buscar informações dos pedidos relacionados
    const shipmentsWithOrders = await Promise.all(
      shipments.map(async (shipment) => {
        if (!shipment.orderId) {
          return { ...shipment, order: null };
        }

        const order = await this.prisma.order.findFirst({
          where: { meliOrderId: shipment.orderId },
          select: {
            id: true,
            meliOrderId: true,
            buyerNickname: true,
            itemTitle: true,
            itemPermalink: true,
            totalAmount: true,
            dateCreated: true,
          },
        });

        return { ...shipment, order };
      }),
    );

    return { items: shipmentsWithOrders };
  }

  @Get('stats')
  async stats(@Query('accountId') accountId?: string) {
    const where: any = {
      status: { in: ['pending', 'handling', 'ready_to_ship'] },
    };

    if (accountId) {
      where.accountId = accountId;
    }

    const [total, onTime, delayed, urgent] = await Promise.all([
      this.prisma.shipment.count({ where }),
      this.prisma.shipment.count({ where: { ...where, slaStatus: 'on_time' } }),
      this.prisma.shipment.count({ where: { ...where, slaStatus: 'delayed' } }),
      // Urgente: menos de 24h para o prazo
      this.prisma.shipment.count({
        where: {
          ...where,
          slaExpectedDate: {
            lte: new Date(Date.now() + 24 * 60 * 60 * 1000),
            gte: new Date(),
          },
        },
      }),
    ]);

    return {
      total,
      onTime,
      delayed,
      urgent,
    };
  }
}
