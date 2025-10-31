import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MeliService } from '../meli/meli.service';
import { ExpensesService } from '../expenses/expenses.service';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private prisma: PrismaService,
    private meliService: MeliService,
    private expensesService: ExpensesService,
  ) {}

  /**
   * Sincroniza períodos de faturamento do Mercado Livre
   */
  async syncBillingPeriods(accountId: string) {
    try {
      this.logger.log(`Syncing billing periods for account ${accountId}`);

      const account = await this.prisma.account.findUnique({
        where: { id: accountId },
        include: { tokens: { orderBy: { obtainedAt: 'desc' }, take: 1 } },
      });

      if (!account || !account.tokens[0]) {
        throw new Error('Account or token not found');
      }

      const accessToken = account.tokens[0].accessToken;
      const periodsUrl = 'https://api.mercadolibre.com/billing/integration/monthly/periods';
      
      const response = await fetch(periodsUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        throw new Error(`ML API error: ${response.status}`);
      }

      const data = await response.json();
      const periods = data.results || [];

      let syncedCount = 0;
      let errorCount = 0;

      for (const period of periods) {
        try {
          await this.saveBillingPeriod(accountId, period, accessToken);
          syncedCount++;
        } catch (error) {
          this.logger.error(`Error syncing period ${period.key}: ${error.message}`);
          errorCount++;
        }
      }

      this.logger.log(`Billing sync completed: ${syncedCount} synced, ${errorCount} errors`);
      return { synced: syncedCount, errors: errorCount, total: periods.length };
    } catch (error) {
      this.logger.error(`Error in billing sync: ${error.message}`);
      throw error;
    }
  }

  /**
   * Salva ou atualiza um período de faturamento
   */
  private async saveBillingPeriod(accountId: string, periodData: any, accessToken: string) {
    const periodKey = periodData.key;
    const summaryUrl = `https://api.mercadolibre.com/billing/integration/periods/key/${periodKey}/summary?group=ML`;
    
    let summaryData: any = null;
    try {
      const summaryResponse = await fetch(summaryUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (summaryResponse.ok) {
        summaryData = await summaryResponse.json();
      }
    } catch (error) {
      this.logger.warn(`Could not fetch summary for period ${periodKey}`);
    }

    const totalAmount = periodData.amount || 0;
    const unpaidAmount = periodData.unpaid_amount || 0;
    
    let feesAmount = 0;
    let taxAmount = 0;
    
    if (summaryData?.summary?.charges) {
      for (const charge of summaryData.summary.charges) {
        const isTax = charge.label.toLowerCase().includes('imposto') ||
                      charge.label.toLowerCase().includes('percepcao') ||
                      charge.label.toLowerCase().includes('percepção') ||
                      charge.label.toLowerCase().includes('iva') ||
                      charge.label.toLowerCase().includes('iibb');
        
        if (isTax) {
          taxAmount += charge.amount || 0;
        } else {
          feesAmount += charge.amount || 0;
        }
      }
    }

    const netAmount = totalAmount - feesAmount - taxAmount;

    const billingPeriod = await this.prisma.billingPeriod.upsert({
      where: { accountId_periodKey: { accountId, periodKey } },
      create: {
        accountId,
        periodKey,
        dateFrom: new Date(periodData.period.date_from),
        dateTo: new Date(periodData.period.date_to),
        expirationDate: new Date(periodData.expiration_date),
        periodStatus: periodData.period_status || 'CLOSED',
        totalAmount,
        unpaidAmount,
        feesAmount,
        taxAmount,
        netAmount,
        rawData: { period: periodData, summary: summaryData },
      },
      update: {
        totalAmount,
        unpaidAmount,
        feesAmount,
        taxAmount,
        netAmount,
        periodStatus: periodData.period_status || 'CLOSED',
        rawData: { period: periodData, summary: summaryData },
      },
    });

    if (summaryData?.summary) {
      await this.saveCharges(billingPeriod.id, accountId, summaryData.summary, periodData);
    }

    return billingPeriod;
  }

  /**
   * Salva detalhes das cobranças de um período
   */
  private async saveCharges(periodId: string, accountId: string, summary: any, periodData: any) {
    await this.prisma.billingCharge.deleteMany({ where: { periodId } });

    const charges: any[] = [];

    if (summary.charges) {
      for (const charge of summary.charges) {
        const isTax = charge.label.toLowerCase().includes('imposto') ||
                      charge.label.toLowerCase().includes('percepcao') ||
                      charge.label.toLowerCase().includes('percepção') ||
                      charge.label.toLowerCase().includes('iva') ||
                      charge.label.toLowerCase().includes('iibb');

        charges.push({
          periodId,
          accountId,
          chargeType: isTax ? 'TAX' : 'FEE_ML',
          category: charge.label,
          description: charge.label,
          amount: charge.amount,
          chargeDate: new Date(periodData.period.date_to),
          rawData: charge,
        });
      }
    }

    if (summary.bonuses) {
      for (const bonus of summary.bonuses) {
        charges.push({
          periodId,
          accountId,
          chargeType: 'BONUS',
          category: bonus.label,
          description: bonus.label,
          amount: -bonus.amount,
          chargeDate: new Date(periodData.period.date_to),
          rawData: bonus,
        });
      }
    }

    if (charges.length > 0) {
      await this.prisma.billingCharge.createMany({ data: charges });
    }
  }

  /**
   * Busca períodos de faturamento
   */
  async getBillingPeriods(accountId: string, options?: {
    limit?: number;
    offset?: number;
    status?: string;
  }) {
    const { limit = 12, offset = 0, status } = options || {};
    const where: any = { accountId };
    if (status) where.periodStatus = status;

    const [periods, total] = await Promise.all([
      this.prisma.billingPeriod.findMany({
        where,
        orderBy: { dateFrom: 'desc' },
        take: limit,
        skip: offset,
        include: { _count: { select: { charges: true } } },
      }),
      this.prisma.billingPeriod.count({ where }),
    ]);

    return { periods, total, limit, offset };
  }

  /**
   * Busca detalhes de um período específico
   */
  async getBillingPeriodDetails(periodId: string) {
    const period = await this.prisma.billingPeriod.findUnique({
      where: { id: periodId },
      include: { charges: { orderBy: { amount: 'desc' } } },
    });

    if (!period) throw new Error('Period not found');

    const chargesByType = period.charges.reduce((acc, charge) => {
      if (!acc[charge.chargeType]) acc[charge.chargeType] = [];
      acc[charge.chargeType].push(charge);
      return acc;
    }, {} as Record<string, any[]>);

    return { ...period, chargesByType };
  }

  /**
   * Busca estatísticas financeiras
   */
  async getFinancialStats(accountId: string, months: number = 12) {
    const periods = await this.prisma.billingPeriod.findMany({
      where: { accountId },
      orderBy: { dateFrom: 'desc' },
      take: months,
    });

    // Se não houver períodos de billing, calcular baseado em orders
    if (periods.length === 0) {
      return this.getFinancialStatsFromOrders(accountId, months);
    }

    const totalRevenue = periods.reduce((sum, p) => sum + p.totalAmount, 0);
    const totalFees = periods.reduce((sum, p) => sum + p.feesAmount, 0);
    const totalTaxes = periods.reduce((sum, p) => sum + p.taxAmount, 0);
    const totalNet = periods.reduce((sum, p) => sum + p.netAmount, 0);
    const avgRevenue = totalRevenue / periods.length || 0;
    const avgNet = totalNet / periods.length || 0;
    const profitMargin = totalRevenue > 0 ? (totalNet / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalFees,
      totalTaxes,
      totalNet,
      avgRevenue,
      avgNet,
      profitMargin,
      periodsCount: periods.length,
      periods: periods.map(p => ({
        periodKey: p.periodKey,
        totalAmount: p.totalAmount,
        netAmount: p.netAmount,
        dateFrom: p.dateFrom,
        dateTo: p.dateTo,
      })),
    };
  }

  /**
   * Calcula estatísticas financeiras baseado nos pedidos (fallback)
   */
  private async getFinancialStatsFromOrders(accountId: string, months: number = 12) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const orders = await this.prisma.order.findMany({
      where: {
        accountId,
        dateCreated: { gte: startDate },
      },
      orderBy: { dateCreated: 'desc' },
    });

    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    
    // Estimativa de taxas ML (aproximadamente 12-16% dependendo da categoria)
    const estimatedFees = totalRevenue * 0.14; // 14% médio
    
    // Estimativa de impostos (aproximadamente 6-8%)
    const estimatedTaxes = totalRevenue * 0.07; // 7% médio
    
    const totalNet = totalRevenue - estimatedFees - estimatedTaxes;
    const profitMargin = totalRevenue > 0 ? (totalNet / totalRevenue) * 100 : 0;

    // Agrupar por mês
    const periodMap = new Map<string, { total: number; count: number }>();
    
    orders.forEach(order => {
      const monthKey = order.dateCreated.toISOString().substring(0, 7); // YYYY-MM
      const existing = periodMap.get(monthKey) || { total: 0, count: 0 };
      periodMap.set(monthKey, {
        total: existing.total + order.totalAmount,
        count: existing.count + 1,
      });
    });

    const periods = Array.from(periodMap.entries())
      .map(([key, data]) => ({
        periodKey: key,
        totalAmount: data.total,
        netAmount: data.total * 0.79, // 79% após taxas e impostos
        orderCount: data.count,
      }))
      .sort((a, b) => b.periodKey.localeCompare(a.periodKey));

    return {
      totalRevenue,
      totalFees: estimatedFees,
      totalTaxes: estimatedTaxes,
      totalNet,
      avgRevenue: totalRevenue / Math.max(periods.length, 1),
      avgNet: totalNet / Math.max(periods.length, 1),
      profitMargin,
      periodsCount: periods.length,
      periods,
      note: 'Calculado baseado em pedidos (API de billing indisponível). Taxas e impostos são estimativas.',
    };
  }

  /**
   * Análise de rentabilidade por produto
   */
  async getProductProfitability(accountId: string, months: number = 12) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Buscar pedidos com informações do item
    const orders = await this.prisma.order.findMany({
      where: {
        accountId,
        dateCreated: { gte: startDate },
        itemTitle: { not: null },
      },
      select: {
        itemId: true,
        itemTitle: true,
        totalAmount: true,
        dateCreated: true,
      },
      orderBy: { dateCreated: 'desc' },
    });

    // Agrupar por produto
    const productMap = new Map<string, {
      itemId: string;
      title: string;
      totalRevenue: number;
      orderCount: number;
      avgOrderValue: number;
    }>();

    orders.forEach(order => {
      if (!order.itemId || !order.itemTitle) return;

      const existing = productMap.get(order.itemId) || {
        itemId: order.itemId,
        title: order.itemTitle,
        totalRevenue: 0,
        orderCount: 0,
        avgOrderValue: 0,
      };

      existing.totalRevenue += order.totalAmount;
      existing.orderCount += 1;
      productMap.set(order.itemId, existing);
    });

    // Calcular métricas e ordenar
    const products = Array.from(productMap.values())
      .map(product => {
        const fees = product.totalRevenue * 0.14;
        const taxes = product.totalRevenue * 0.07;
        const netRevenue = product.totalRevenue - fees - taxes;
        const profitMargin = product.totalRevenue > 0 
          ? (netRevenue / product.totalRevenue) * 100 
          : 0;

        return {
          ...product,
          avgOrderValue: product.totalRevenue / product.orderCount,
          fees,
          taxes,
          netRevenue,
          profitMargin,
        };
      })
      .sort((a, b) => b.netRevenue - a.netRevenue);

    return {
      products,
      totalProducts: products.length,
      topProducts: products.slice(0, 10),
    };
  }

  /**
   * Breakdown de custos (para gráfico)
   */
  async getCostBreakdown(accountId: string, months: number = 12) {
    const stats = await this.getFinancialStats(accountId, months);
    
    // Buscar despesas fixas
    const expensesSummary = await this.expensesService.getSummaryByCategory(accountId);
    const totalExpenses = expensesSummary.reduce((sum: number, item: any) => sum + item.total, 0);
    
    // Calcular lucro real (após despesas fixas)
    const realProfit = stats.totalNet - totalExpenses;

    return {
      breakdown: [
        { name: 'Lucro Real', value: realProfit > 0 ? realProfit : 0, color: '#10b981' },
        { name: 'Despesas Fixas', value: totalExpenses, color: '#8b5cf6' },
        { name: 'Taxas ML/MP', value: stats.totalFees, color: '#f59e0b' },
        { name: 'Impostos', value: stats.totalTaxes, color: '#ef4444' },
      ],
      total: stats.totalRevenue,
      totalExpenses,
      realProfit,
    };
  }
}
