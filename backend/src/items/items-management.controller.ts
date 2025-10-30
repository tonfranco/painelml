import { Controller, Post, Put, Body, Query, Param, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MeliService } from '../meli/meli.service';
import { ItemsService } from './items.service';

@Controller('items-management')
export class ItemsManagementController {
  private readonly logger = new Logger(ItemsManagementController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly meliService: MeliService,
    private readonly itemsService: ItemsService,
  ) {}

  /**
   * Cria um novo anúncio
   */
  @Post('create')
  async createItem(
    @Query('accountId') accountId: string,
    @Body() itemData: any,
  ) {
    if (!accountId) {
      return { error: 'accountId is required' };
    }

    try {
      this.logger.log(`Creating new item for account ${accountId}`);

      // Criar item no Mercado Livre
      const mlItem = await this.meliService.createItem(accountId, itemData);

      // Sincronizar item no banco de dados
      await this.itemsService.syncItem(accountId, mlItem.id);

      return {
        success: true,
        itemId: mlItem.id,
        permalink: mlItem.permalink,
      };
    } catch (error) {
      this.logger.error(`Error creating item: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Duplica um anúncio existente
   */
  @Post('duplicate/:itemId')
  async duplicateItem(
    @Param('itemId') itemId: string,
    @Query('accountId') accountId: string,
    @Body() modifications: { titleSuffix?: string; titlePrefix?: string; titleReplace?: { from: string; to: string } },
  ) {
    if (!accountId) {
      return { error: 'accountId is required' };
    }

    try {
      this.logger.log(`Duplicating item ${itemId} for account ${accountId}`);

      // Buscar item original do ML
      const originalItem = await this.meliService.getItem(accountId, itemId);
      
      this.logger.log(`Original item status: ${originalItem.status}`);

      // Criar cópia do item apenas com campos obrigatórios
      const newItemData: any = {
        title: originalItem.title,
        category_id: originalItem.category_id,
        price: originalItem.price,
        currency_id: originalItem.currency_id || 'BRL',
        available_quantity: originalItem.available_quantity > 0 ? originalItem.available_quantity : 1,
        buying_mode: originalItem.buying_mode,
        listing_type_id: originalItem.listing_type_id,
        condition: originalItem.condition,
      };

      // Adicionar imagens se existirem
      if (originalItem.pictures && originalItem.pictures.length > 0) {
        newItemData.pictures = originalItem.pictures.slice(0, 10).map((p: any) => ({
          source: p.secure_url || p.url
        }));
      }

      // Adicionar atributos - filtrar apenas os que têm value_name
      if (originalItem.attributes && originalItem.attributes.length > 0) {
        const validAttributes = originalItem.attributes
          .filter((attr: any) => {
            // Incluir apenas atributos com value_name válido
            return attr.id && attr.value_name && typeof attr.value_name === 'string';
          })
          .map((attr: any) => {
            const attrData: any = { id: attr.id };
            
            // Se tiver value_id, usar ele (é um valor pré-definido)
            if (attr.value_id) {
              attrData.value_id = attr.value_id;
            } else if (attr.value_name) {
              // Senão, usar value_name
              attrData.value_name = attr.value_name;
            }
            
            return attrData;
          });
        
        if (validAttributes.length > 0) {
          newItemData.attributes = validAttributes;
        }
      }

      // Adicionar shipping básico
      if (originalItem.shipping) {
        newItemData.shipping = {
          mode: originalItem.shipping.mode || 'me2',
          free_shipping: Boolean(originalItem.shipping.free_shipping),
        };
        
        // Adicionar local_pick_up se existir
        if (originalItem.shipping.local_pick_up !== undefined) {
          newItemData.shipping.local_pick_up = Boolean(originalItem.shipping.local_pick_up);
        }
      }

      // Aplicar modificações no título
      if (modifications.titleSuffix) {
        newItemData.title = `${originalItem.title} ${modifications.titleSuffix}`;
      } else if (modifications.titlePrefix) {
        newItemData.title = `${modifications.titlePrefix} ${originalItem.title}`;
      } else if (modifications.titleReplace) {
        newItemData.title = originalItem.title.replace(
          modifications.titleReplace.from,
          modifications.titleReplace.to,
        );
      } else {
        newItemData.title = `${originalItem.title} - Cópia`;
      }

      // Limitar título a 60 caracteres (limite do ML)
      if (newItemData.title.length > 60) {
        newItemData.title = newItemData.title.substring(0, 60);
      }

      // Remover campos undefined ou null
      Object.keys(newItemData).forEach(key => {
        if (newItemData[key] === undefined || newItemData[key] === null) {
          delete newItemData[key];
        }
      });

      this.logger.log(`Creating duplicate with data: ${JSON.stringify(newItemData, null, 2)}`);

      // Criar novo item no ML
      const mlItem = await this.meliService.createItem(accountId, newItemData);

      // Sincronizar no banco
      await this.itemsService.syncItem(accountId, mlItem.id);

      return {
        success: true,
        originalItemId: itemId,
        newItemId: mlItem.id,
        newTitle: mlItem.title,
        permalink: mlItem.permalink,
      };
    } catch (error: any) {
      this.logger.error(`Error duplicating item ${itemId}: ${JSON.stringify(error.response?.data || error.message)}`);
      
      // Extrair mensagem de erro mais específica
      let errorMessage = error.message;
      if (error.response?.data) {
        const data = error.response.data;
        if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.cause && data.cause.length > 0) {
          errorMessage = data.cause.map((c: any) => `${c.code}: ${c.message}`).join(', ');
        }
      }
      
      return {
        success: false,
        error: errorMessage,
        details: error.response?.data,
      };
    }
  }

  /**
   * Atualiza estoque de um item
   */
  @Put('stock/:itemId')
  async updateStock(
    @Param('itemId') itemId: string,
    @Query('accountId') accountId: string,
    @Body() body: { quantity: number },
  ) {
    if (!accountId) {
      return { error: 'accountId is required' };
    }

    try {
      this.logger.log(`Updating stock for item ${itemId}: ${body.quantity}`);

      await this.meliService.updateStock(accountId, itemId, body.quantity);

      // Atualizar no banco
      await this.prisma.item.update({
        where: { meliItemId: itemId },
        data: { available: body.quantity },
      });

      return {
        success: true,
        itemId,
        newQuantity: body.quantity,
      };
    } catch (error) {
      this.logger.error(`Error updating stock: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Atualiza preço de um item
   */
  @Put('price/:itemId')
  async updatePrice(
    @Param('itemId') itemId: string,
    @Query('accountId') accountId: string,
    @Body() body: { price: number },
  ) {
    if (!accountId) {
      return { error: 'accountId is required' };
    }

    try {
      this.logger.log(`Updating price for item ${itemId}: ${body.price}`);

      const result = await this.meliService.updatePrice(accountId, itemId, body.price);
      
      this.logger.log(`Price update response: ${JSON.stringify(result)}`);

      // Atualizar no banco
      await this.prisma.item.update({
        where: { meliItemId: itemId },
        data: { price: body.price },
      });

      return {
        success: true,
        itemId,
        newPrice: body.price,
      };
    } catch (error: any) {
      this.logger.error(`Error updating price for ${itemId}: ${JSON.stringify(error.response?.data || error.message)}`);
      
      // Extrair mensagem de erro mais específica
      let errorMessage = error.message;
      if (error.response?.data) {
        const data = error.response.data;
        if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.cause && data.cause.length > 0) {
          errorMessage = data.cause.map((c: any) => c.message || c.code).join(', ');
        }
        
        // Verificar se é erro relacionado a lances
        if (errorMessage.includes('has_bids') || errorMessage.includes('not_modifiable')) {
          errorMessage = 'Não é possível alterar preço de anúncios com lances ativos. Esta é uma restrição do Mercado Livre para proteger os compradores em leilões.';
        }
      }
      
      return {
        success: false,
        error: errorMessage,
        details: error.response?.data,
      };
    }
  }

  /**
   * Atualiza estoque em massa
   */
  @Put('stock/bulk')
  async updateStockBulk(
    @Query('accountId') accountId: string,
    @Body() body: { items: Array<{ itemId: string; quantity: number }> },
  ) {
    if (!accountId) {
      return { error: 'accountId is required' };
    }

    const results = [];

    for (const item of body.items) {
      try {
        await this.meliService.updateStock(accountId, item.itemId, item.quantity);
        await this.prisma.item.update({
          where: { meliItemId: item.itemId },
          data: { available: item.quantity },
        });
        results.push({ itemId: item.itemId, success: true });
      } catch (error) {
        this.logger.error(`Error updating stock for ${item.itemId}: ${error.message}`);
        results.push({ itemId: item.itemId, success: false, error: error.message });
      }
    }

    return {
      total: body.items.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }

  /**
   * Sincroniza todos os itens para atualizar informações de lances
   */
  @Post('sync-bids')
  async syncAllItemsForBids(@Query('accountId') accountId: string) {
    if (!accountId) {
      return { error: 'accountId is required' };
    }

    try {
      this.logger.log(`Starting bid sync for account ${accountId}`);
      const result = await this.itemsService.syncAllItemsForBids(accountId);
      
      return {
        success: true,
        message: 'Sincronização de informações de lances concluída',
        ...result
      };
    } catch (error: any) {
      this.logger.error(`Error in bid sync: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Atualiza preço em massa
   */
  @Put('price/bulk')
  async updatePriceBulk(
    @Query('accountId') accountId: string,
    @Body() body: { items: Array<{ itemId: string; price: number }> },
  ) {
    if (!accountId) {
      return { error: 'accountId is required' };
    }

    const results = [];

    for (const item of body.items) {
      try {
        await this.meliService.updatePrice(accountId, item.itemId, item.price);
        await this.prisma.item.update({
          where: { meliItemId: item.itemId },
          data: { price: item.price },
        });
        results.push({ itemId: item.itemId, success: true });
      } catch (error) {
        this.logger.error(`Error updating price for ${item.itemId}: ${error.message}`);
        results.push({ itemId: item.itemId, success: false, error: error.message });
      }
    }

    return {
      total: body.items.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }
}
