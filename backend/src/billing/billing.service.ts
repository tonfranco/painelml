import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MeliService } from '../meli/meli.service';
import { ExpensesService } from '../expenses/expenses.service';
import { TaxesService } from '../taxes/taxes.service';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private prisma: PrismaService,
    private meliService: MeliService,
    private expensesService: ExpensesService,
    private taxesService: TaxesService,
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
      
      // Tentar primeiro a API de billing (pode não estar disponível para todas as contas)
      const periodsUrl = 'https://api.mercadolibre.com/billing/integration/monthly/periods';
      
      this.logger.log(`Attempting to fetch billing periods from: ${periodsUrl}`);
      
      const response = await fetch(periodsUrl, {
        headers: { 
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(`ML API error ${response.status}: ${errorBody}`);
        
        if (response.status === 403 || response.status === 404) {
          this.logger.warn(
            'API de billing não disponível. Isso é normal para contas que não têm acesso à API de integração. ' +
            'Os dados financeiros serão calculados baseados nos pedidos.'
          );
          
          // Retornar resultado vazio mas bem-sucedido
          return {
            synced: 0,
            total: 0,
            errors: 0,
            message: 'API de billing não disponível para esta conta. Usando dados de pedidos como alternativa.',
          };
        }
        
        throw new Error(`ML API error: ${response.status} - ${errorBody}`);
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
    
    // Sem estimativas - usar apenas valores reais
    const totalFees = 0;
    const totalTaxes = 0;
    
    const totalNet = totalRevenue;
    const profitMargin = 100;

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
        netAmount: data.total, // Valor bruto sem descontos
        orderCount: data.count,
      }))
      .sort((a, b) => b.periodKey.localeCompare(a.periodKey));

    return {
      totalRevenue,
      totalFees,
      totalTaxes,
      totalNet,
      avgRevenue: totalRevenue / Math.max(periods.length, 1),
      avgNet: totalNet / Math.max(periods.length, 1),
      profitMargin,
      periodsCount: periods.length,
      periods,
      note: 'Calculado baseado em pedidos. Sincronize os períodos de billing do ML para dados mais precisos.',
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
    
    // Buscar impostos/taxas cadastrados
    const taxesSummary = await this.taxesService.getSummaryByCategory(accountId);
    const totalCustomTaxes = taxesSummary.reduce((sum: number, item: any) => sum + item.total, 0);
    
    // Total de impostos = impostos do ML + impostos cadastrados
    const totalTaxesAndFees = stats.totalFees + stats.totalTaxes + totalCustomTaxes;
    
    // Calcular lucro real (após despesas fixas e impostos cadastrados)
    const realProfit = stats.totalNet - totalExpenses - totalCustomTaxes;

    return {
      breakdown: [
        { name: 'Lucro Real', value: realProfit > 0 ? realProfit : 0, color: '#10b981' },
        { name: 'Despesas Fixas', value: totalExpenses, color: '#8b5cf6' },
        { name: 'Taxas + Impostos', value: totalTaxesAndFees, color: '#ef4444' },
      ],
      total: stats.totalRevenue,
      totalExpenses,
      totalTaxes: totalTaxesAndFees,
      totalCustomTaxes,
      realProfit,
    };
  }

  /**
   * Previsão de recebimentos (Fluxo de Caixa)
   */
  async getCashFlowForecast(accountId: string) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const next7Days = new Date(today);
    next7Days.setDate(today.getDate() + 7);
    const next30Days = new Date(today);
    next30Days.setDate(today.getDate() + 30);

    // Buscar pedidos com status de pagamento
    const orders = await this.prisma.order.findMany({
      where: {
        accountId,
        status: { in: ['paid', 'confirmed'] },
      },
      orderBy: { dateCreated: 'desc' },
    });

    // Calcular recebimentos esperados
    // ML geralmente libera o dinheiro após 15-30 dias dependendo da reputação
    const expectedReleases = orders.map(order => {
      const orderDate = new Date(order.dateCreated);
      const estimatedReleaseDate = new Date(orderDate);
      estimatedReleaseDate.setDate(orderDate.getDate() + 20); // Média de 20 dias

      return {
        orderId: order.meliOrderId,
        amount: order.totalAmount,
        orderDate: order.dateCreated,
        estimatedReleaseDate,
        status: order.status,
      };
    });

    // Filtrar por períodos
    const receivablesToday = expectedReleases.filter(r => 
      r.estimatedReleaseDate <= today
    );
    const receivablesNext7Days = expectedReleases.filter(r => 
      r.estimatedReleaseDate > today && r.estimatedReleaseDate <= next7Days
    );
    const receivablesNext30Days = expectedReleases.filter(r => 
      r.estimatedReleaseDate > next7Days && r.estimatedReleaseDate <= next30Days
    );

    return {
      today: {
        count: receivablesToday.length,
        total: receivablesToday.reduce((sum, r) => sum + r.amount, 0),
        items: receivablesToday,
      },
      next7Days: {
        count: receivablesNext7Days.length,
        total: receivablesNext7Days.reduce((sum, r) => sum + r.amount, 0),
        items: receivablesNext7Days,
      },
      next30Days: {
        count: receivablesNext30Days.length,
        total: receivablesNext30Days.reduce((sum, r) => sum + r.amount, 0),
        items: receivablesNext30Days,
      },
      overdue: {
        count: receivablesToday.length,
        total: receivablesToday.reduce((sum, r) => sum + r.amount, 0),
      },
    };
  }

  /**
   * Conciliação bancária
   */
  async getBankReconciliation(accountId: string) {
    // Buscar períodos de billing (pagamentos esperados)
    const periods = await this.prisma.billingPeriod.findMany({
      where: { accountId },
      orderBy: { dateFrom: 'desc' },
      take: 12,
    });

    // Para cada período, verificar se o valor foi recebido
    const reconciliation = periods.map(period => {
      const expectedAmount = period.netAmount;
      const receivedAmount = period.netAmount; // TODO: Integrar com dados bancários reais
      const difference = receivedAmount - expectedAmount;
      const status = Math.abs(difference) < 0.01 ? 'matched' : 'divergent';

      return {
        periodKey: period.periodKey,
        dateFrom: period.dateFrom,
        dateTo: period.dateTo,
        expectedAmount,
        receivedAmount,
        difference,
        status,
        percentageDiff: expectedAmount > 0 ? (difference / expectedAmount) * 100 : 0,
      };
    });

    const matched = reconciliation.filter(r => r.status === 'matched').length;
    const divergent = reconciliation.filter(r => r.status === 'divergent').length;
    const totalDivergence = reconciliation.reduce((sum, r) => sum + Math.abs(r.difference), 0);

    return {
      summary: {
        total: reconciliation.length,
        matched,
        divergent,
        totalDivergence,
        matchRate: reconciliation.length > 0 ? (matched / reconciliation.length) * 100 : 0,
      },
      items: reconciliation,
    };
  }

  /**
   * Alertas de divergências
   */
  async getDivergenceAlerts(accountId: string) {
    const reconciliation = await this.getBankReconciliation(accountId);
    
    const alerts = reconciliation.items
      .filter(item => item.status === 'divergent')
      .map(item => ({
        type: 'divergence',
        severity: Math.abs(item.percentageDiff) > 5 ? 'high' : 'medium',
        periodKey: item.periodKey,
        message: `Divergência de ${item.difference > 0 ? '+' : ''}${item.difference.toFixed(2)} (${item.percentageDiff.toFixed(2)}%)`,
        expectedAmount: item.expectedAmount,
        receivedAmount: item.receivedAmount,
        difference: item.difference,
      }));

    return {
      total: alerts.length,
      high: alerts.filter(a => a.severity === 'high').length,
      medium: alerts.filter(a => a.severity === 'medium').length,
      alerts,
    };
  }

  /**
   * Busca detalhes de pagamentos de um período específico
   */
  async getPaymentDetails(accountId: string, periodKey: string, options?: {
    limit?: number;
    offset?: number;
    sortBy?: 'ID' | 'DATE';
    orderBy?: 'ASC' | 'DESC';
  }) {
    try {
      const { limit = 150, offset = 0, sortBy = 'ID', orderBy = 'ASC' } = options || {};

      const account = await this.prisma.account.findUnique({
        where: { id: accountId },
        include: { tokens: { orderBy: { obtainedAt: 'desc' }, take: 1 } },
      });

      if (!account || !account.tokens[0]) {
        throw new Error('Account or token not found');
      }

      const accessToken = account.tokens[0].accessToken;
      
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        sort_by: sortBy,
        order_by: orderBy,
      });

      const url = `https://api.mercadolibre.com/billing/integration/periods/key/${periodKey}/group/ML/payment/details?${params}`;
      
      this.logger.log(`Fetching payment details from: ${url}`);
      
      const response = await fetch(url, {
        headers: { 
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(`ML API error ${response.status}: ${errorBody}`);
        
        if (response.status === 403 || response.status === 404) {
          return {
            payments: [],
            total: 0,
            message: 'API de pagamentos não disponível para esta conta.',
          };
        }
        
        throw new Error(`ML API error: ${response.status} - ${errorBody}`);
      }

      const data = await response.json();
      
      return {
        payments: data.payment_info || [],
        total: data.paging?.total || 0,
        limit: data.paging?.limit || limit,
        offset: data.paging?.offset || offset,
      };
    } catch (error) {
      this.logger.error(`Error fetching payment details: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca charges (cobranças) de um pagamento específico
   */
  async getPaymentCharges(accountId: string, paymentId: string, options?: {
    limit?: number;
    offset?: number;
    sortBy?: 'ID' | 'DATE';
    orderBy?: 'ASC' | 'DESC';
  }) {
    try {
      const { limit = 150, offset = 0, sortBy = 'ID', orderBy = 'ASC' } = options || {};

      const account = await this.prisma.account.findUnique({
        where: { id: accountId },
        include: { tokens: { orderBy: { obtainedAt: 'desc' }, take: 1 } },
      });

      if (!account || !account.tokens[0]) {
        throw new Error('Account or token not found');
      }

      const accessToken = account.tokens[0].accessToken;
      
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        sort_by: sortBy,
        order_by: orderBy,
      });

      const url = `https://api.mercadolibre.com/billing/integration/payment/${paymentId}/charges?${params}`;
      
      this.logger.log(`Fetching payment charges from: ${url}`);
      
      const response = await fetch(url, {
        headers: { 
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(`ML API error ${response.status}: ${errorBody}`);
        
        if (response.status === 403 || response.status === 404) {
          return {
            charges: [],
            message: 'API de charges não disponível para este pagamento.',
          };
        }
        
        throw new Error(`ML API error: ${response.status} - ${errorBody}`);
      }

      const data = await response.json();
      
      return {
        charges: data.payment_details || [],
        total: data.payment_details?.length || 0,
      };
    } catch (error) {
      this.logger.error(`Error fetching payment charges: ${error.message}`);
      throw error;
    }
  }

  /**
   * Salva detalhes de pagamentos no banco de dados
   */
  async syncPaymentDetails(accountId: string, periodKey: string) {
    try {
      this.logger.log(`Syncing payment details for period ${periodKey}`);

      const paymentDetails = await this.getPaymentDetails(accountId, periodKey, { limit: 1000 });
      
      if (!paymentDetails.payments || paymentDetails.payments.length === 0) {
        return {
          synced: 0,
          message: 'Nenhum pagamento encontrado para este período.',
        };
      }

      // Buscar o período no banco
      const period = await this.prisma.billingPeriod.findFirst({
        where: { accountId, periodKey },
      });

      if (!period) {
        throw new Error(`Period ${periodKey} not found in database`);
      }

      let syncedCount = 0;

      for (const payment of paymentDetails.payments) {
        try {
          await this.prisma.billingPayment.upsert({
            where: {
              periodId_paymentId: {
                periodId: period.id,
                paymentId: payment.payment_id,
              },
            },
            create: {
              periodId: period.id,
              accountId,
              paymentId: payment.payment_id,
              creditNoteNumber: payment.credit_note_number,
              paymentDate: new Date(payment.payment_date),
              paymentType: payment.payment_type,
              paymentTypeDescription: payment.payment_type_description,
              paymentMethod: payment.payment_method,
              paymentMethodDescription: payment.payment_method_description,
              paymentStatus: payment.payment_status,
              paymentStatusDescription: payment.payment_status_description,
              paymentAmount: payment.payment_amount || 0,
              amountInThisPeriod: payment.amount_in_this_period || 0,
              amountInOtherPeriod: payment.amount_in_other_period || 0,
              remainingAmount: payment.remaining_amount || 0,
              returnAmount: payment.return_amount || 0,
              rawData: payment,
            },
            update: {
              paymentDate: new Date(payment.payment_date),
              paymentType: payment.payment_type,
              paymentTypeDescription: payment.payment_type_description,
              paymentMethod: payment.payment_method,
              paymentMethodDescription: payment.payment_method_description,
              paymentStatus: payment.payment_status,
              paymentStatusDescription: payment.payment_status_description,
              paymentAmount: payment.payment_amount || 0,
              amountInThisPeriod: payment.amount_in_this_period || 0,
              amountInOtherPeriod: payment.amount_in_other_period || 0,
              remainingAmount: payment.remaining_amount || 0,
              returnAmount: payment.return_amount || 0,
              rawData: payment,
            },
          });

          syncedCount++;
        } catch (error) {
          this.logger.error(`Error syncing payment ${payment.payment_id}: ${error.message}`);
        }
      }

      this.logger.log(`Payment details sync completed: ${syncedCount} synced`);
      return {
        synced: syncedCount,
        total: paymentDetails.payments.length,
      };
    } catch (error) {
      this.logger.error(`Error in payment details sync: ${error.message}`);
      throw error;
    }
  }
}
