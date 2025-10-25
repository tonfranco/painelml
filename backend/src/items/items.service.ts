import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MeliService } from '../meli/meli.service';

@Injectable()
export class ItemsService {
  private readonly logger = new Logger(ItemsService.name);

  constructor(
    private prisma: PrismaService,
    private meliService: MeliService,
  ) {}

  /**
   * Sincroniza um item específico do Mercado Livre
   */
  async syncItem(accountId: string, itemId: string) {
    try {
      this.logger.log(`Syncing item ${itemId} for account ${accountId}`);

      const itemData = await this.meliService.makeAuthenticatedRequest(
        accountId,
        `https://api.mercadolibre.com/items/${itemId}`,
      );

      // Pegar a primeira imagem em alta resolução, se disponível
      const picture = itemData.pictures && itemData.pictures.length > 0
        ? itemData.pictures[0].url || itemData.pictures[0].secure_url
        : null;

      const item = await this.prisma.item.upsert({
        where: { meliItemId: itemId },
        create: {
          accountId,
          meliItemId: itemId,
          title: itemData.title,
          status: itemData.status,
          price: itemData.price || 0,
          available: itemData.available_quantity || 0,
          sold: itemData.sold_quantity || 0,
          thumbnail: itemData.thumbnail,
          picture: picture,
          permalink: itemData.permalink,
        },
        update: {
          title: itemData.title,
          status: itemData.status,
          price: itemData.price || 0,
          available: itemData.available_quantity || 0,
          sold: itemData.sold_quantity || 0,
          thumbnail: itemData.thumbnail,
          picture: picture,
          permalink: itemData.permalink,
        },
      });

      this.logger.log(`Item ${itemId} synced successfully`);
      return item;
    } catch (error) {
      this.logger.error(`Error syncing item ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * Retorna estatísticas de items
   */
  async getStats(accountId?: string) {
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
