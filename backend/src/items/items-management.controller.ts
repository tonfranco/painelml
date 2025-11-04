import { Controller, Get, Post, Put, Body, Query, Param, Logger } from '@nestjs/common';
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
   * Preview de duplicação - mostra os dados que seriam enviados
   */
  @Get('duplicate/:itemId/preview')
  async previewDuplicate(
    @Param('itemId') itemId: string,
    @Query('accountId') accountId: string,
  ) {
    if (!accountId) {
      return { error: 'accountId is required' };
    }

    try {
      const originalItem = await this.meliService.getItem(accountId, itemId);
      
      // Preparar dados como seria feito na duplicação
      const newItemData: any = {
        title: originalItem.title + ' - Preview',
        category_id: originalItem.category_id,
        price: originalItem.price,
        currency_id: originalItem.currency_id || 'BRL',
        available_quantity: originalItem.available_quantity > 0 ? originalItem.available_quantity : 1,
        buying_mode: originalItem.buying_mode,
        listing_type_id: originalItem.listing_type_id,
        condition: originalItem.condition,
      };

      // Adicionar imagens
      if (originalItem.pictures && originalItem.pictures.length > 0) {
        newItemData.pictures = originalItem.pictures.slice(0, 10).map((p: any) => ({
          source: p.secure_url || p.url
        }));
      }

      // Adicionar atributos (mesma lógica de filtragem da duplicação)
      if (originalItem.attributes && originalItem.attributes.length > 0) {
        const problematicAttributes = [
          'NET_VOLUME', 'NET_WEIGHT', 'SERVING_VOLUME',
          'SERVING_WEIGHT', 'UNIT_VOLUME', 'UNIT_WEIGHT',
          'MIN_RECOMMENDED_AGE',
        ];
        
        const validAttributes = originalItem.attributes
          .filter((attr: any) => {
            if (problematicAttributes.includes(attr.id)) return false;
            if (!attr.id) return false;
            if (attr.value_id) return true;
            if (attr.value_name && typeof attr.value_name === 'string') {
              const valueLower = attr.value_name.toLowerCase();
              if (valueLower.startsWith('0 ') || valueLower === '1' || valueLower === '0') {
                return false;
              }
              return true;
            }
            return false;
          })
          .map((attr: any) => {
            const attrData: any = { id: attr.id };
            if (attr.value_id) {
              attrData.value_id = attr.value_id;
            }
            if (attr.value_name) {
              attrData.value_name = attr.value_name;
            }
            return attrData;
          });
        
        if (validAttributes.length > 0) {
          newItemData.attributes = validAttributes;
        }
      }

      // Adicionar shipping
      if (originalItem.shipping) {
        newItemData.shipping = {
          mode: originalItem.shipping.mode || 'me2',
          free_shipping: Boolean(originalItem.shipping.free_shipping),
        };
        if (originalItem.shipping.local_pick_up !== undefined) {
          newItemData.shipping.local_pick_up = Boolean(originalItem.shipping.local_pick_up);
        }
      }

      return {
        success: true,
        originalItem: {
          id: originalItem.id,
          title: originalItem.title,
          hasVariations: originalItem.variations?.length || 0,
          status: originalItem.status,
        },
        dataToSend: newItemData,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Duplica um anúncio existente (uma ou múltiplas vezes)
   */
  @Post('duplicate/:itemId')
  async duplicateItem(
    @Param('itemId') itemId: string,
    @Query('accountId') accountId: string,
    @Body() modifications: { 
      titleSuffix?: string; 
      titlePrefix?: string; 
      titleReplace?: { from: string; to: string };
      quantity?: number; // Quantidade de cópias a criar
      ignoreVariations?: boolean; // Criar sem variações (anúncio simples)
    },
  ) {
    if (!accountId) {
      return { error: 'accountId is required' };
    }

    try {
      const quantity = modifications.quantity && modifications.quantity > 0 ? modifications.quantity : 1;
      this.logger.log(`Duplicating item ${itemId} ${quantity} time(s) for account ${accountId}`);

      // Buscar item original do ML
      const originalItem = await this.meliService.getItem(accountId, itemId);
      
      this.logger.log(`Original item status: ${originalItem.status}`);
      
      // Verificar se o item tem variações
      if (originalItem.variations && originalItem.variations.length > 0) {
        if (!modifications.ignoreVariations) {
          // Se não foi solicitado ignorar variações, retornar erro
          this.logger.warn(`Item ${itemId} has ${originalItem.variations.length} variations - cannot be duplicated without ignoreVariations flag`);
          return {
            success: false,
            error: `Este anúncio possui ${originalItem.variations.length} variação(ões).\n\nA API do Mercado Livre não permite duplicar anúncios com variações.\n\nVocê pode criar uma cópia SEM as variações (anúncio simples) e adicionar as variações manualmente depois no Mercado Livre.`,
            reason: 'HAS_VARIATIONS',
            variationsCount: originalItem.variations.length,
            canCreateWithoutVariations: true,
          };
        } else {
          // Criar sem variações (anúncio simples)
          this.logger.log(`Item ${itemId} has ${originalItem.variations.length} variations - will create as simple item (ignoring variations)`);
          
          // Usar preço e quantidade da primeira variação se disponível
          if (originalItem.variations[0]) {
            const firstVariation = originalItem.variations[0];
            if (firstVariation.price) {
              originalItem.price = firstVariation.price;
            }
            if (firstVariation.available_quantity !== undefined) {
              originalItem.available_quantity = firstVariation.available_quantity;
            }
            
            // IMPORTANTE: Mesclar atributos da variação com os atributos do item
            // Isso garante que atributos obrigatórios (como FLAVOR/Sabor e GTIN) sejam incluídos
            
            // Criar mapa de atributos existentes
            const existingAttrIds = new Set(originalItem.attributes.map((a: any) => a.id));
            
            // 1. Adicionar attribute_combinations (ex: FLAVOR)
            if (firstVariation.attribute_combinations && firstVariation.attribute_combinations.length > 0) {
              this.logger.log(`Merging ${firstVariation.attribute_combinations.length} attribute_combinations from first variation`);
              
              firstVariation.attribute_combinations.forEach((varAttr: any) => {
                if (!existingAttrIds.has(varAttr.id)) {
                  originalItem.attributes.push({
                    id: varAttr.id,
                    value_id: varAttr.value_id,
                    value_name: varAttr.value_name,
                  });
                  existingAttrIds.add(varAttr.id);
                  this.logger.log(`Added attribute_combination: ${varAttr.id} = ${varAttr.value_name || varAttr.value_id}`);
                }
              });
            }
            
            // 2. Adicionar attributes da variação (ex: GTIN, SELLER_SKU)
            if (firstVariation.attributes && firstVariation.attributes.length > 0) {
              this.logger.log(`Merging ${firstVariation.attributes.length} attributes from first variation`);
              
              firstVariation.attributes.forEach((varAttr: any) => {
                if (!existingAttrIds.has(varAttr.id)) {
                  originalItem.attributes.push({
                    id: varAttr.id,
                    value_id: varAttr.value_id,
                    value_name: varAttr.value_name,
                  });
                  existingAttrIds.add(varAttr.id);
                  this.logger.log(`Added variation attribute: ${varAttr.id} = ${varAttr.value_name || varAttr.value_id}`);
                }
              });
            }
          }
        }
      }
      
      // Verificar se o item está pausado ou fechado
      if (originalItem.status !== 'active') {
        this.logger.warn(`Item ${itemId} is not active (status: ${originalItem.status})`);
        return {
          success: false,
          error: `Este anúncio não está ativo (status: ${originalItem.status}).\n\nApenas anúncios ativos podem ser duplicados. Reative o anúncio original primeiro.`,
          reason: 'NOT_ACTIVE',
          status: originalItem.status,
        };
      }

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

      // Adicionar atributos - filtrar apenas os que têm value_name válido
      if (originalItem.attributes && originalItem.attributes.length > 0) {
        // Lista de atributos problemáticos que devem ser ignorados
        const problematicAttributes = [
          'NET_VOLUME',
          'NET_WEIGHT', 
          'SERVING_VOLUME',
          'SERVING_WEIGHT',
          'UNIT_VOLUME',
          'UNIT_WEIGHT',
          'MIN_RECOMMENDED_AGE', // Pode ter valor genérico
          'IS_TOM_BRAND', // Não é modificável segundo a API
        ];
        
        const validAttributes = originalItem.attributes
          .filter((attr: any) => {
            // Ignorar atributos problemáticos
            if (problematicAttributes.includes(attr.id)) {
              return false;
            }
            
            // Incluir apenas atributos com value_name válido ou value_id
            if (!attr.id) return false;
            
            // Se tem value_id, é válido
            if (attr.value_id) return true;
            
            // Se tem value_name, verificar se não é valor inválido
            if (attr.value_name && typeof attr.value_name === 'string') {
              const valueLower = attr.value_name.toLowerCase();
              // Ignorar valores que começam com "0 " ou são muito genéricos
              if (valueLower.startsWith('0 ') || valueLower === '1' || valueLower === '0') {
                return false;
              }
              return true;
            }
            
            return false;
          })
          .map((attr: any) => {
            const attrData: any = { id: attr.id };
            
            // Adicionar value_id se existir
            if (attr.value_id) {
              attrData.value_id = attr.value_id;
            }
            
            // Adicionar value_name se existir (alguns atributos precisam de ambos)
            if (attr.value_name) {
              attrData.value_name = attr.value_name;
            }
            
            return attrData;
          });
        
        if (validAttributes.length > 0) {
          newItemData.attributes = validAttributes;
          
          // Verificar se precisa adicionar UNITS_PER_PACK
          const hasSaleFormat = validAttributes.find((a: any) => a.id === 'SALE_FORMAT');
          const hasUnitsPerPack = validAttributes.find((a: any) => a.id === 'UNITS_PER_PACK');
          
          // Se tem SALE_FORMAT mas não tem UNITS_PER_PACK, adicionar com valor padrão
          if (hasSaleFormat && !hasUnitsPerPack) {
            this.logger.log('Adding UNITS_PER_PACK attribute with default value 1');
            newItemData.attributes.push({
              id: 'UNITS_PER_PACK',
              value_name: '1'
            });
          }
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

      // Array para armazenar resultados
      const createdItems = [];
      const errors = [];

      // Criar múltiplas cópias
      for (let i = 0; i < quantity; i++) {
        let itemDataCopy: any = null; // Declarar fora do try para acessar no catch
        try {
          // Clonar o objeto base para cada iteração
          itemDataCopy = JSON.parse(JSON.stringify(newItemData));
          
          // Aplicar modificações no título
          if (modifications.titleSuffix) {
            itemDataCopy.title = `${originalItem.title} ${modifications.titleSuffix}`;
          } else if (modifications.titlePrefix) {
            itemDataCopy.title = `${modifications.titlePrefix} ${originalItem.title}`;
          } else if (modifications.titleReplace) {
            itemDataCopy.title = originalItem.title.replace(
              modifications.titleReplace.from,
              modifications.titleReplace.to,
            );
          } else {
            itemDataCopy.title = `${originalItem.title} - Cópia`;
          }

          // Se for múltiplas cópias, adicionar número
          if (quantity > 1) {
            itemDataCopy.title = `${itemDataCopy.title} ${i + 1}`;
          }

          // Limitar título a 60 caracteres (limite do ML)
          if (itemDataCopy.title.length > 60) {
            itemDataCopy.title = itemDataCopy.title.substring(0, 60);
          }

          // Remover campos undefined ou null
          Object.keys(itemDataCopy).forEach(key => {
            if (itemDataCopy[key] === undefined || itemDataCopy[key] === null) {
              delete itemDataCopy[key];
            }
          });

          this.logger.log(`Creating duplicate ${i + 1}/${quantity} with title: ${itemDataCopy.title}`);
          this.logger.debug(`Item data to be sent: ${JSON.stringify(itemDataCopy, null, 2)}`);

          // Criar novo item no ML
          const mlItem = await this.meliService.createItem(accountId, itemDataCopy);

          // Sincronizar no banco
          await this.itemsService.syncItem(accountId, mlItem.id);

          createdItems.push({
            itemId: mlItem.id,
            title: mlItem.title,
            permalink: mlItem.permalink,
          });

          this.logger.log(`✅ Successfully created item ${i + 1}/${quantity}: ${mlItem.id}`);

          // Pequeno delay entre criações para evitar rate limit (500ms)
          if (i < quantity - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error: any) {
          this.logger.error(`❌ Error creating duplicate ${i + 1}/${quantity}: ${error.message}`);
          
          // Log completo do erro para debug
          if (error.response?.data) {
            this.logger.error(`Full API error response: ${JSON.stringify(error.response.data, null, 2)}`);
          }
          
          // Log dos dados que foram enviados
          this.logger.error(`Data that was sent: ${JSON.stringify(itemDataCopy, null, 2)}`);
          
          // Extrair mensagem de erro detalhada
          let errorMessage = error.message;
          let errorDetails = error.response?.data;
          
          if (error.response?.data) {
            const data = error.response.data;
            if (data.message) {
              errorMessage = data.message;
            }
            
            // Verificar se é erro de GTIN faltando
            if (data.cause && Array.isArray(data.cause)) {
              const gtinError = data.cause.find((c: any) => 
                c.code === 'item.attribute.missing_conditional_required' && 
                c.message?.includes('GTIN')
              );
              
              if (gtinError) {
                errorMessage = '⚠️ Código de Barras (GTIN) Obrigatório\n\n' +
                              'Esta categoria exige o código de barras (GTIN/EAN) do produto.\n\n' +
                              'O anúncio original não possui GTIN cadastrado. Para duplicar este anúncio, você tem duas opções:\n\n' +
                              '1. Adicione o GTIN no anúncio original primeiro e tente duplicar novamente\n' +
                              '2. Crie o anúncio manualmente no Mercado Livre informando o código de barras\n\n' +
                              'Nota: Anúncios antigos podiam ser criados sem GTIN, mas novos anúncios nesta categoria exigem este campo.';
              } else {
                errorMessage += '\n\nDetalhes:\n' + data.cause.map((c: any) => 
                  `• ${c.code || ''}: ${c.message || JSON.stringify(c)}`
                ).join('\n');
              }
            }
          }
          
          errors.push({
            index: i + 1,
            error: errorMessage,
            details: errorDetails,
          });
        }
      }

      return {
        success: createdItems.length > 0,
        originalItemId: itemId,
        created: createdItems.length,
        failed: errors.length,
        total: quantity,
        items: createdItems,
        errors: errors.length > 0 ? errors : undefined,
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
   * Busca detalhes completos de um item do ML
   */
  @Get('item/:itemId')
  async getItemDetails(
    @Param('itemId') itemId: string,
    @Query('accountId') accountId: string,
  ) {
    if (!accountId) {
      return { error: 'accountId is required' };
    }

    try {
      const itemDetails = await this.meliService.getItem(accountId, itemId);
      return {
        success: true,
        data: itemDetails,
      };
    } catch (error: any) {
      this.logger.error(`Error fetching item details for ${itemId}: ${error.message}`);
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

      // Primeiro, buscar detalhes do item para verificar o tipo de listagem
      const itemDetails = await this.meliService.getItem(accountId, itemId);
      
      this.logger.log(`Item details - listing_type_id: ${itemDetails.listing_type_id}, status: ${itemDetails.status}, buying_mode: ${itemDetails.buying_mode}`);
      
      // Log completo para debug
      this.logger.debug(`Full item details: ${JSON.stringify({
        id: itemDetails.id,
        listing_type_id: itemDetails.listing_type_id,
        buying_mode: itemDetails.buying_mode,
        status: itemDetails.status,
        price: itemDetails.price,
        catalog_product_id: itemDetails.catalog_product_id,
        variations: itemDetails.variations?.length || 0,
      })}`);
      
      // Verificar se é um leilão (listing_type_id começa com "auction")
      const isAuction = itemDetails.listing_type_id?.toLowerCase().startsWith('auction');
      
      // Verificar se tem campo non_mercado_pago_payment_methods (indicador de leilão)
      const hasNonMPPayments = itemDetails.non_mercado_pago_payment_methods && 
                               itemDetails.non_mercado_pago_payment_methods.length > 0;
      
      if (isAuction || hasNonMPPayments) {
        this.logger.warn(`Item ${itemId} is an auction listing (listing_type: ${itemDetails.listing_type_id})`);
        return {
          success: false,
          error: 'Este anúncio está configurado como leilão. Não é possível alterar o preço de anúncios em formato de leilão através da API.',
          itemDetails: {
            listing_type_id: itemDetails.listing_type_id,
            status: itemDetails.status,
            isAuction: true,
          },
        };
      }
      
      // Verificar se é um produto do catálogo (pode ter restrições)
      if (itemDetails.catalog_product_id) {
        this.logger.warn(`Item ${itemId} is a catalog product (catalog_product_id: ${itemDetails.catalog_product_id})`);
      }

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
      let errorCode = null;
      
      if (error.response?.data) {
        const data = error.response.data;
        
        // Log completo do erro para análise
        this.logger.error(`Full error response: ${JSON.stringify(data)}`);
        
        if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.cause && data.cause.length > 0) {
          errorMessage = data.cause.map((c: any) => c.message || c.code).join(', ');
          errorCode = data.cause[0]?.code;
        }
        
        // Verificar se é erro relacionado a lances/leilão
        if (errorMessage.includes('has_bids') || errorMessage.includes('not_modifiable')) {
          // Mensagem mais detalhada baseada no código do erro
          if (errorCode === 'item.price.not_modifiable') {
            errorMessage = `⚠️ Preço não modificável (Código: ${errorCode})\n\n` +
                          `A API do Mercado Livre está bloqueando a alteração de preço deste item.\n\n` +
                          `Possíveis causas:\n` +
                          `• Item pode ter ofertas/promoções ativas\n` +
                          `• Item pode estar em processo de venda\n` +
                          `• Restrições temporárias da plataforma\n\n` +
                          `Tente editar diretamente no site do Mercado Livre.`;
          } else {
            errorMessage = 'Não é possível alterar preço de anúncios com lances ativos ou em formato de leilão. Esta é uma restrição do Mercado Livre.';
          }
        }
      }
      
      return {
        success: false,
        error: errorMessage,
        errorCode: errorCode,
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
