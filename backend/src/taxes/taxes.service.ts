import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TaxesService {
  private readonly logger = new Logger(TaxesService.name);

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
    return this.prisma.tax.create({
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

    return this.prisma.tax.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.tax.findUnique({
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
    return this.prisma.tax.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.tax.delete({
      where: { id },
    });
  }

  async getTotalForMonth(accountId: string, year: number, month: number) {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);

    const taxes = await this.prisma.tax.findMany({
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

    return taxes.reduce((sum, tax) => sum + tax.amount, 0);
  }

  async getSummaryByCategory(accountId: string) {
    const taxes = await this.prisma.tax.findMany({
      where: {
        accountId,
        isActive: true,
      },
    });

    const summary = taxes.reduce((acc, tax) => {
      if (!acc[tax.category]) {
        acc[tax.category] = {
          category: tax.category,
          total: 0,
          count: 0,
        };
      }
      acc[tax.category].total += tax.amount;
      acc[tax.category].count += 1;
      return acc;
    }, {} as Record<string, { category: string; total: number; count: number }>);

    return Object.values(summary);
  }
}
