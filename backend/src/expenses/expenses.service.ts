import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExpensesService {
  private readonly logger = new Logger(ExpensesService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Criar nova despesa
   */
  async create(accountId: string, data: {
    name: string;
    category: string;
    amount: number;
    description?: string;
    isRecurring?: boolean;
    startDate?: Date;
    endDate?: Date;
  }) {
    return this.prisma.expense.create({
      data: {
        accountId,
        ...data,
      },
    });
  }

  /**
   * Listar todas as despesas
   */
  async findAll(accountId: string, includeInactive = false) {
    const where: any = { accountId };
    
    if (!includeInactive) {
      where.isActive = true;
    }

    return this.prisma.expense.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Buscar despesa por ID
   */
  async findOne(id: string) {
    return this.prisma.expense.findUnique({
      where: { id },
    });
  }

  /**
   * Atualizar despesa
   */
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
    return this.prisma.expense.update({
      where: { id },
      data,
    });
  }

  /**
   * Deletar despesa
   */
  async remove(id: string) {
    return this.prisma.expense.delete({
      where: { id },
    });
  }

  /**
   * Calcular total de despesas ativas para um mês
   */
  async getTotalForMonth(accountId: string, year: number, month: number) {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);

    const expenses = await this.prisma.expense.findMany({
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

    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  }

  /**
   * Obter resumo de despesas por categoria
   */
  async getSummaryByCategory(accountId: string) {
    const expenses = await this.prisma.expense.findMany({
      where: {
        accountId,
        isActive: true,
      },
    });

    const summary = expenses.reduce((acc, expense) => {
      if (!acc[expense.category]) {
        acc[expense.category] = {
          category: expense.category,
          total: 0,
          count: 0,
        };
      }
      acc[expense.category].total += expense.amount;
      acc[expense.category].count += 1;
      return acc;
    }, {} as Record<string, { category: string; total: number; count: number }>);

    return Object.values(summary);
  }
}
