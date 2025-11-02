import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MeliService } from '../meli/meli.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private meliService: MeliService,
  ) {}

  /**
   * Sincroniza um pedido específico do Mercado Livre
   */
  async syncOrder(accountId: string, orderId: string) {
    try {
      this.logger.log(`Syncing order ${orderId} for account ${accountId}`);

      const orderData = await this.meliService.getOrder(accountId, orderId);

      // Extrair informações do primeiro item (geralmente pedidos têm 1 item)
      const firstItem = orderData.order_items?.[0];
      const itemId = firstItem?.item?.id;
      const itemTitle = firstItem?.item?.title;
      
      // Buscar permalink do item se tivermos o ID
      let itemPermalink = null;
      if (itemId) {
        try {
          const itemData = await this.meliService.getItem(accountId, itemId);
          itemPermalink = itemData.permalink;
        } catch (error) {
          this.logger.warn(`Could not fetch item permalink for ${itemId}`);
        }
      }

      const order = await this.prisma.order.upsert({
        where: { meliOrderId: orderId },
        create: {
          accountId,
          meliOrderId: orderId,
          status: orderData.status,
          totalAmount: orderData.total_amount || 0,
          dateCreated: new Date(orderData.date_created),
          buyerId: orderData.buyer?.id?.toString(),
          buyerNickname: orderData.buyer?.nickname,
          itemId,
          itemTitle,
          itemPermalink,
        },
        update: {
          status: orderData.status,
          totalAmount: orderData.total_amount || 0,
          buyerId: orderData.buyer?.id?.toString(),
          buyerNickname: orderData.buyer?.nickname,
          itemId,
          itemTitle,
          itemPermalink,
        },
      });

      this.logger.log(`Order ${orderId} synced successfully`);
      return order;
    } catch (error) {
      this.logger.error(`Error syncing order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Sincroniza todos os pedidos do Mercado Livre
   */
  async syncAllOrders(accountId: string, options?: { limit?: number; offset?: number }) {
    try {
      const { limit = 50, offset = 0 } = options || {};
      
      this.logger.log(`Syncing orders for account ${accountId} (limit: ${limit}, offset: ${offset})`);

      // Buscar pedidos do Mercado Livre
      const ordersData = await this.meliService.getOrders(accountId, { limit, offset });
      
      if (!ordersData || !ordersData.results) {
        return {
          synced: 0,
          total: 0,
          message: 'Nenhum pedido encontrado',
        };
      }

      let syncedCount = 0;
      let errorCount = 0;
      const errors = [];

      for (const orderData of ordersData.results) {
        try {
          await this.syncOrder(accountId, orderData.id.toString());
          syncedCount++;
        } catch (error) {
          this.logger.error(`Error syncing order ${orderData.id}: ${error.message}`);
          errorCount++;
          errors.push({
            orderId: orderData.id,
            error: error.message,
          });
        }
      }

      this.logger.log(`Orders sync completed: ${syncedCount} synced, ${errorCount} errors`);
      
      return {
        synced: syncedCount,
        errors: errorCount,
        total: ordersData.paging?.total || ordersData.results.length,
        hasMore: ordersData.paging?.total > (offset + limit),
        nextOffset: offset + limit,
        errorDetails: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      this.logger.error(`Error in orders sync: ${error.message}`);
      throw error;
    }
  }

  /**
   * Retorna estatísticas de pedidos
   */
  async getStats(accountId?: string, days = 30) {
    const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
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
