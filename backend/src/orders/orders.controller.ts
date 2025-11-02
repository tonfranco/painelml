import { Controller, Get, Post, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
  ) {}

  @Get()
  async list(
    @Query('accountId') accountId?: string,
    @Query('days') days?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    let dateFrom: Date;
    let dateTo: Date;

    // Se startDate e endDate forem fornecidos, usar eles
    if (startDate && endDate) {
      dateFrom = new Date(startDate);
      dateTo = new Date(endDate);
      dateTo.setHours(23, 59, 59, 999); // Incluir o dia inteiro
    } else {
      // Caso contrário, usar days (padrão 30)
      const daysNum = days ? parseInt(days, 10) : 30;
      dateFrom = new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000);
      dateTo = new Date();
    }

    const where = accountId
      ? { accountId, dateCreated: { gte: dateFrom, lte: dateTo } }
      : { dateCreated: { gte: dateFrom, lte: dateTo } };

    const orders = await this.prisma.order.findMany({
      where,
      orderBy: { dateCreated: 'desc' },
      select: {
        id: true,
        meliOrderId: true,
        status: true,
        totalAmount: true,
        dateCreated: true,
        buyerId: true,
        buyerNickname: true,
        itemId: true,
        itemTitle: true,
        itemPermalink: true,
        updatedAt: true,
        createdAt: true,
      },
    });

    // Retornar array direto para compatibilidade com o frontend
    return orders;
  }

  @Get('stats')
  async stats(@Query('accountId') accountId?: string, @Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 30;
    const dateFrom = new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000);

    const where = accountId
      ? { accountId, dateCreated: { gte: dateFrom } }
      : { dateCreated: { gte: dateFrom } };

    const [total, paid, confirmed, cancelled, pending] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.count({ where: { ...where, status: 'paid' } }),
      this.prisma.order.count({ where: { ...where, status: 'confirmed' } }),
      this.prisma.order.count({ where: { ...where, status: 'cancelled' } }),
      this.prisma.order.count({ where: { ...where, status: 'pending' } }),
    ]);

    const totalAmount = await this.prisma.order.aggregate({
      where,
      _sum: { totalAmount: true },
    });

    return {
      total,
      paid,
      confirmed,
      cancelled,
      pending,
      totalAmount: totalAmount._sum.totalAmount || 0,
    };
  }

  @Post('sync')
  async sync(
    @Query('accountId') accountId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    if (!accountId) {
      return { error: 'accountId is required' };
    }

    try {
      const result = await this.ordersService.syncAllOrders(accountId, {
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
      });

      return {
        success: true,
        message: `Synced ${result.synced} of ${result.total} orders`,
        ...result,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post('resync')
  async resync(@Query('accountId') accountId: string) {
    if (!accountId) {
      return { error: 'accountId is required' };
    }

    // Buscar todos os pedidos da conta
    const orders = await this.prisma.order.findMany({
      where: { accountId },
      select: { meliOrderId: true },
      take: 50, // Limitar para não sobrecarregar
    });

    const results = [];
    for (const order of orders) {
      try {
        await this.ordersService.syncOrder(accountId, order.meliOrderId);
        results.push({ orderId: order.meliOrderId, status: 'success' });
      } catch (error) {
        results.push({ orderId: order.meliOrderId, status: 'error', error: error.message });
      }
    }

    return {
      message: `Re-synced ${results.length} orders`,
      results,
    };
  }
}
