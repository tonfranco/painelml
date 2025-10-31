import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExtraRevenuesService {
  private readonly logger = new Logger(ExtraRevenuesService.name);

  constructor(private prisma: PrismaService) {}

  async create(accountId: string, data: {
    name: string;
    category: string;
    amount: number;
    description?: string;
    isRecurring?: boolean;
    startDate?: Date;
    endDate?: Date;
  }) {
    return this.prisma.extraRevenue.create({
      data: {
        accountId,
        ...data,
      },
    });
  }

  async findAll(accountId: string, includeInactive = false) {
    const where: any = { accountId };
    
    if (!includeInactive) {
      where.isActive = true;
    }

    return this.prisma.extraRevenue.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.extraRevenue.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: {
    name?: string;
    category?: string;
    amount?: number;
    description?: string;
    isRecurring?: boolean;
    startDate?: Date;
    endDate?: Date;
    isActive?: boolean;
  }) {
    return this.prisma.extraRevenue.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.extraRevenue.delete({
      where: { id },
    });
  }

  async getTotalForMonth(accountId: string, year: number, month: number) {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);

    const revenues = await this.prisma.extraRevenue.findMany({
      where: {
        accountId,
        isActive: true,
        startDate: { lte: endOfMonth },
        OR: [
          { endDate: null },
          { endDate: { gte: startOfMonth } },
        ],
      },
    });

    return revenues.reduce((sum, revenue) => sum + revenue.amount, 0);
  }

  async getSummaryByCategory(accountId: string) {
    const revenues = await this.prisma.extraRevenue.findMany({
      where: {
        accountId,
        isActive: true,
      },
    });

    const summary = revenues.reduce((acc, revenue) => {
      if (!acc[revenue.category]) {
        acc[revenue.category] = {
          category: revenue.category,
          total: 0,
          count: 0,
        };
      }
      acc[revenue.category].total += revenue.amount;
      acc[revenue.category].count += 1;
      return acc;
    }, {} as Record<string, { category: string; total: number; count: number }>);

    return Object.values(summary);
  }
}
