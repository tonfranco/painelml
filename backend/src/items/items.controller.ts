import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('items')
export class ItemsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query('accountId') accountId?: string) {
    const where = accountId ? { accountId } : {};

    const items = await this.prisma.item.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 100,
      select: {
        id: true,
        meliItemId: true,
        title: true,
        status: true,
        price: true,
        available: true,
        thumbnail: true,
        updatedAt: true,
        createdAt: true,
      },
    });

    return { items };
  }

  @Get('stats')
  async stats(@Query('accountId') accountId?: string) {
    const where = accountId ? { accountId } : {};

    const [total, active, paused, closed] = await Promise.all([
      this.prisma.item.count({ where }),
      this.prisma.item.count({ where: { ...where, status: 'active' } }),
      this.prisma.item.count({ where: { ...where, status: 'paused' } }),
      this.prisma.item.count({ where: { ...where, status: 'closed' } }),
    ]);

    return {
      total,
      active,
      paused,
      closed,
    };
  }
}
