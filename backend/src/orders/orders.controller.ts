import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query('accountId') accountId?: string, @Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 30;
    const dateFrom = new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000);

    const where = accountId
      ? { accountId, dateCreated: { gte: dateFrom } }
      : { dateCreated: { gte: dateFrom } };

    const items = await this.prisma.order.findMany({
      where,
      orderBy: { dateCreated: 'desc' },
      take: 100,
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

    return { items };
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
}
