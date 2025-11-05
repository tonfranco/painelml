import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MeliService } from '../meli/meli.service';
import axios from 'axios';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly meliService: MeliService,
  ) {}

  /**
   * Busca todas as mensagens de uma conta
   */
  async findAll(accountId: string, filters?: { packId?: string; orderId?: string; status?: string }) {
    const where: any = { accountId };
    
    if (filters?.packId) {
      where.packId = filters.packId;
    }
    if (filters?.orderId) {
      where.orderId = filters.orderId;
    }
    if (filters?.status) {
      where.status = filters.status;
    }

    const messages = await this.prisma.message.findMany({
      where,
      orderBy: { dateCreated: 'desc' },
    });

    return messages;
  }

  /**
   * Busca conversas agrupadas por packId
   */
  async findConversations(accountId: string) {
    const messages = await this.prisma.message.findMany({
      where: { accountId },
      orderBy: { dateCreated: 'desc' },
    });

    // Agrupar mensagens por packId
    const conversationsMap = new Map<string, any>();
    
    for (const message of messages) {
      const packId = message.packId || 'no-pack';
      
      if (!conversationsMap.has(packId)) {
        conversationsMap.set(packId, {
          packId: message.packId,
          orderId: message.orderId,
          itemId: message.itemId,
          lastMessage: message.text,
          lastMessageDate: message.dateCreated,
          unreadCount: 0,
          messages: [],
        });
      }
      
      const conversation = conversationsMap.get(packId);
      conversation.messages.push(message);
      
      if (message.status === 'unread' && message.toRole === 'seller') {
        conversation.unreadCount++;
      }
    }

    return Array.from(conversationsMap.values());
  }

  /**
   * Busca uma mensagem específica
   */
  async findOne(id: string) {
    return this.prisma.message.findUnique({
      where: { id },
    });
  }

  /**
   * Sincroniza mensagens da API do Mercado Livre
   */
  async syncMessages(accountId: string) {
    this.logger.log(`Sincronizando mensagens para conta ${accountId}`);

    try {
      const token = await this.meliService.getAccessToken(accountId);
      const account = await this.prisma.account.findUnique({
        where: { id: accountId },
      });

      if (!account) {
        this.logger.error('Account not found');
        throw new Error('Account not found');
      }

      // Buscar mensagens da API do ML
      // Endpoint: GET /messages/packs/{seller_id}/inbox
      const url = `https://api.mercadolibre.com/messages/packs/${account.sellerId}/inbox`;
      
      this.logger.log(`Buscando packs de mensagens em: ${url}`);
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          limit: 50,
        },
        validateStatus: () => true, // Aceitar qualquer status para tratar manualmente
      });

      if (response.status !== 200) {
        this.logger.error(`Erro na API do ML: ${response.status} - ${JSON.stringify(response.data)}`);
        throw new Error(`API do Mercado Livre retornou erro: ${response.status}`);
      }

      const packs = response.data.results || response.data.packs || [];
      this.logger.log(`Encontrados ${packs.length} packs de mensagens`);
      
      let syncedCount = 0;

      for (const pack of packs) {
        try {
          // Para cada pack, buscar as mensagens
          const messagesUrl = `https://api.mercadolibre.com/messages/packs/${pack.id}`;
          const messagesResponse = await axios.get(messagesUrl, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            validateStatus: () => true,
          });

          if (messagesResponse.status !== 200) {
            this.logger.warn(`Erro ao buscar pack ${pack.id}: ${messagesResponse.status}`);
            continue;
          }

          const packData = messagesResponse.data;
          const messages = packData.messages || [];

          for (const msg of messages) {
            await this.upsertMessage(accountId, msg, pack.id);
            syncedCount++;
          }
        } catch (packError) {
          this.logger.warn(`Erro ao processar pack ${pack.id}: ${packError.message}`);
        }
      }

      this.logger.log(`Sincronizadas ${syncedCount} mensagens para conta ${accountId}`);
      return { success: true, count: syncedCount, message: `${syncedCount} mensagens sincronizadas` };
    } catch (error) {
      this.logger.error(`Erro ao sincronizar mensagens: ${error.message}`, error.stack);
      return { 
        success: false, 
        count: 0, 
        error: error.message,
        message: 'Erro ao sincronizar mensagens. Verifique se a conta tem permissão para acessar mensagens.'
      };
    }
  }

  /**
   * Insere ou atualiza uma mensagem no banco
   */
  private async upsertMessage(accountId: string, messageData: any, packId?: string) {
    try {
      const data = {
        accountId,
        meliMessageId: messageData.id.toString(),
        packId: packId || messageData.pack_id?.toString(),
        orderId: messageData.order_id?.toString(),
        itemId: messageData.item_id?.toString(),
        fromId: messageData.from.user_id?.toString() || '',
        toId: messageData.to.user_id?.toString() || '',
        fromRole: messageData.from.role || 'unknown',
        toRole: messageData.to.role || 'unknown',
        text: messageData.text || '',
        status: messageData.status || 'unread',
        dateCreated: new Date(messageData.date_created),
        dateRead: messageData.date_read ? new Date(messageData.date_read) : null,
        dateNotified: messageData.date_notified ? new Date(messageData.date_notified) : null,
      };

      await this.prisma.message.upsert({
        where: { meliMessageId: data.meliMessageId },
        update: data,
        create: data,
      });
    } catch (error) {
      this.logger.error(`Erro ao fazer upsert de mensagem: ${error.message}`);
    }
  }

  /**
   * Envia uma mensagem para um comprador
   */
  async sendMessage(accountId: string, packId: string, text: string) {
    this.logger.log(`Enviando mensagem para pack ${packId}`);

    try {
      const token = await this.meliService.getAccessToken(accountId);
      const account = await this.prisma.account.findUnique({
        where: { id: accountId },
      });

      if (!account) {
        throw new Error('Account not found');
      }

      // Endpoint: POST /messages/packs/{pack_id}/sellers/{seller_id}
      const url = `https://api.mercadolibre.com/messages/packs/${packId}/sellers/${account.sellerId}`;
      
      const response = await axios.post(
        url,
        {
          text,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      // Salvar mensagem enviada no banco
      await this.upsertMessage(accountId, response.data, packId);

      this.logger.log(`Mensagem enviada com sucesso para pack ${packId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Erro ao enviar mensagem: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Marca mensagens como lidas
   */
  async markAsRead(accountId: string, messageIds: string[]) {
    await this.prisma.message.updateMany({
      where: {
        accountId,
        id: { in: messageIds },
      },
      data: {
        status: 'read',
        dateRead: new Date(),
      },
    });

    return { success: true };
  }

  /**
   * Estatísticas de mensagens
   */
  async getStats(accountId?: string) {
    const where = accountId ? { accountId } : {};

    const [total, unread] = await Promise.all([
      this.prisma.message.count({ where }),
      this.prisma.message.count({
        where: {
          ...where,
          status: 'unread',
          toRole: 'seller',
        },
      }),
    ]);

    return {
      total,
      unread,
      read: total - unread,
    };
  }

  /**
   * Cria mensagens de teste para desenvolvimento
   */
  async seedTestData(accountId: string) {
    this.logger.log(`Criando mensagens de teste para conta ${accountId}`);

    const testMessages = [
      {
        packId: 'pack-001',
        text: 'Olá! Gostaria de saber se o produto está disponível para entrega imediata?',
        fromRole: 'buyer',
        toRole: 'seller',
        status: 'unread',
      },
      {
        packId: 'pack-001',
        text: 'Sim, temos em estoque! Podemos enviar hoje mesmo.',
        fromRole: 'seller',
        toRole: 'buyer',
        status: 'read',
      },
      {
        packId: 'pack-002',
        text: 'Qual o prazo de entrega para o CEP 01310-100?',
        fromRole: 'buyer',
        toRole: 'seller',
        status: 'unread',
      },
      {
        packId: 'pack-003',
        text: 'O produto aceita cartão de crédito?',
        fromRole: 'buyer',
        toRole: 'seller',
        status: 'unread',
      },
      {
        packId: 'pack-003',
        text: 'Sim, aceitamos todas as formas de pagamento do Mercado Livre.',
        fromRole: 'seller',
        toRole: 'buyer',
        status: 'read',
      },
      {
        packId: 'pack-004',
        text: 'Vocês fazem entrega no sábado?',
        fromRole: 'buyer',
        toRole: 'seller',
        status: 'unread',
      },
    ];

    let count = 0;
    for (const msg of testMessages) {
      await this.prisma.message.create({
        data: {
          accountId,
          meliMessageId: `test-msg-${Date.now()}-${count}`,
          packId: msg.packId,
          fromId: msg.fromRole === 'buyer' ? '123456789' : '216277116',
          toId: msg.toRole === 'buyer' ? '123456789' : '216277116',
          fromRole: msg.fromRole,
          toRole: msg.toRole,
          text: msg.text,
          status: msg.status,
          dateCreated: new Date(Date.now() - count * 3600000), // Cada mensagem 1h antes
        },
      });
      count++;
    }

    this.logger.log(`Criadas ${count} mensagens de teste`);
    return { success: true, count, message: `${count} mensagens de teste criadas` };
  }
}
